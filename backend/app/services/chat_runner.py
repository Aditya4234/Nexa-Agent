import asyncio
import copy
import json
import time
import uuid
from typing import Any, AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import AgentRegistry
from app.core.config import settings
from app.models.agent import AgentRun
from app.models.approval import ApprovalRequest
from app.models.conversation import Conversation, Message
from app.models.notification import Notification
from app.models.user import User
from app.plugins.registry import plugin_context
from app.services.llm import LLMService
from app.services.llm_config import resolve_config
from app.services.streaming import sse_format
from app.services.usage import estimate_cost
from app.tools.registry import registry


class ChatRunner:
    def __init__(self, db: AsyncSession, user_id: int) -> None:
        self.db = db
        self.user_id = user_id
        self.llm = LLMService()
        self.agents = AgentRegistry(db)

    async def _build_history(self, conversation_id: int, limit: int = 24) -> list[dict]:
        from sqlalchemy import select

        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        rows = list(reversed(result.scalars().all()))
        return [{"role": m.role, "content": m.content} for m in rows if m.role in ("user", "assistant")]

    def _record_usage(self, run: AgentRun) -> None:
        usage = self.llm.last_usage
        run.tokens = (run.tokens or 0) + usage.get("total_tokens", 0)
        run.cost = round((run.cost or 0.0) + estimate_cost(run.model or "default", usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)), 6)

    async def _notify(self, run: AgentRun, conv_id: int | None = None) -> None:
        try:
            title = "Agent run completed" if run.status == "completed" else "Agent run failed"
            body = run.input[:80] or "Agent run"
            self.db.add(
                Notification(
                    user_id=self.user_id,
                    title=title,
                    body=body,
                    type="run",
                    link=f"/runs/{run.id}",
                )
            )
            await self.db.commit()
        except Exception:  # noqa: BLE001
            pass

    async def _request_approval(self, run_id: str, tool_id: str, args: dict, holder: dict[str, Any], reason: str = "") -> AsyncIterator[str]:
        """Creates an approval request, emits the SSE event, and polls until the user decides."""
        approval = ApprovalRequest(
            user_id=self.user_id,
            run_id=run_id,
            tool_id=tool_id,
            args=json.dumps(args, default=str),
            reason=reason or f"This action uses the '{tool_id}' tool and requires your approval.",
        )
        self.db.add(approval)
        await self.db.flush()
        await self.db.commit()

        yield sse_format(
            "approval.required",
            {
                "approval_id": approval.id,
                "tool_id": tool_id,
                "args": args,
                "reason": approval.reason,
            },
        )

        deadline = time.monotonic() + settings.APPROVAL_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            await asyncio.sleep(settings.APPROVAL_POLL_INTERVAL)
            current = await self.db.get(ApprovalRequest, approval.id)
            if current and current.status == "approved":
                holder["approved"] = True
                return
            if current and current.status == "rejected":
                yield sse_format("approval.rejected", {"approval_id": approval.id, "tool_id": tool_id})
                holder["approved"] = False
                return
        # timed out
        if current is not None and current.status == "pending":
            current.status = "timed_out"
            current.resolved_at = self._now()
            await self.db.commit()
        yield sse_format("approval.timeout", {"approval_id": approval.id, "tool_id": tool_id})
        holder["approved"] = False

    @staticmethod
    def _now():
        from app.models.user import utcnow

        return utcnow()

    async def _retrieve_context(self, query: str, llm_config) -> str:
        """RAG: pulls the most relevant chunks from the user's knowledge base."""
        try:
            from app.services.knowledge import KnowledgeService

            payload = await KnowledgeService(self.db).search(self.user_id, query, k=4, llm_config=llm_config)
            results = payload["results"]
            if not results:
                return ""
            lines = [f"- [from {r['doc_name']} (score {r['score']})] {r['content']}" for r in results]
            return "Relevant knowledge from the user's knowledge base:\n" + "\n".join(lines)
        except Exception:  # noqa: BLE001 - RAG is best-effort
            return ""

    async def run(self, payload) -> AsyncIterator[str]:
        agent = await self.agents.get(payload.agent_id, self.user_id)
        user = await self.db.get(User, self.user_id)
        llm_config = resolve_config(user, payload.model)
        run_started = time.monotonic()

        # ---- conversation ----
        if payload.conversation_id:
            conv = await self.db.get(Conversation, payload.conversation_id)
            if not conv or conv.user_id != self.user_id:
                conv = Conversation(user_id=self.user_id, title=self._title(payload.message), model=payload.model, agent_id=payload.agent_id)
                self.db.add(conv)
                await self.db.flush()
        else:
            conv = Conversation(user_id=self.user_id, title=self._title(payload.message), model=payload.model, agent_id=payload.agent_id)
            self.db.add(conv)
            await self.db.flush()

        conv.status = "running"
        self.db.add(Message(conversation_id=conv.id, role="user", content=payload.message))
        await self.db.commit()

        yield sse_format("conversation.created", {"id": conv.id, "title": conv.title})

        run = AgentRun(
            id=str(uuid.uuid4()),
            agent_id=agent.id if agent else None,
            conversation_id=conv.id,
            user_id=self.user_id,
            status="running",
            input=payload.message,
        )
        self.db.add(run)
        await self.db.commit()
        yield sse_format("run.started", {"run_id": run.id})

        # ---- agent pipeline ----
        if agent and agent.is_system and agent.name == "Planner":
            plan = await self._make_plan(payload.message)
            run.steps = [{"name": s, "status": "completed"} for s in plan]
            run.status = "completed"
            run.model = payload.model
            run.duration_ms = int((time.monotonic() - run_started) * 1000)
            await self.db.commit()
            yield sse_format("plan.created", {"steps": plan})
            yield sse_format("agent.completed", {"result": "Plan created.", "run_id": run.id})
            return

        system_prompt = self.agents.system_prompt_for(agent, "You are AgentX, an enterprise-grade autonomous AI platform assistant.")
        history = await self._build_history(conv.id, limit=12)
        history = [m for m in history if m["role"] in ("user", "assistant")]

        yield sse_format("agent.started", {"agent_id": agent.id if agent else None, "agent_name": agent.name if agent else "Assistant"})
        yield sse_format("agent.thinking", {"detail": "Understanding request"})

        if agent:
            plan = await self._make_plan(payload.message)
            run.steps = [{"name": s, "status": "completed"} for s in plan]
            yield sse_format("plan.created", {"steps": plan})
        else:
            run.steps = [{"name": "Responding", "status": "completed"}]

        # ---- RAG context ----
        knowledge_block = ""
        if user:
            knowledge_block = await self._retrieve_context(payload.message, llm_config)

        # ---- plugin context ----
        plugin_block = plugin_context(payload.plugins)
        if plugin_block:
            yield sse_format("plugins.ready", {"plugins": payload.plugins})

        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        if knowledge_block:
            messages.append({"role": "system", "content": knowledge_block})
        if plugin_block:
            messages.append({"role": "system", "content": plugin_block})
        messages.extend(history)

        tools = self.agents.tools_for(agent, payload.tools)
        run.tools_used = []
        temperature = agent.temperature if agent else 0.7
        max_tokens = agent.max_tokens if agent else 2048

        # ---- real tool-calling path (LLM decides tools) ----
        if tools and llm_config.available:
            holder: dict[str, Any] = {}
            async for ev in self._tool_loop(messages, tools, run, agent, llm_config, temperature, max_tokens, holder):
                yield ev
            conv.status = "idle"
            final_answer = holder.get("answer")
            if final_answer is None:
                run.status = "failed"
                run.error = holder.get("error") or "Too many tool steps. Stopped after the step limit."
                run.model = payload.model
                run.duration_ms = int((time.monotonic() - run_started) * 1000)
                await self.db.commit()
                await self._notify(run)
                if "error" not in holder:
                    yield sse_format("agent.error", {"message": run.error})
                return
            for word in final_answer.split(" "):
                yield sse_format("agent.message", {"content": word + " "})
                await asyncio.sleep(0.015)
            answer = final_answer
            run.result = answer
            run.status = "completed"
            run.model = payload.model
            self._record_usage(run)
            run.duration_ms = int((time.monotonic() - run_started) * 1000)
            self.db.add(Message(conversation_id=conv.id, role="assistant", content=answer))
            await self.db.commit()
            await self._notify(run)
            yield sse_format("agent.completed", {"result": answer, "run_id": run.id, "conversation_id": conv.id})
            return

        # ---- mock / simple streaming path ----
        tool_context = []
        for tool_id in tools[:3]:
            tool = registry.get(tool_id)
            if not tool:
                continue
            args = self._auto_args(tool_id, payload.message)
            if args is None:
                continue
            yield sse_format("tool.started", {"tool_id": tool_id, "args": args})
            result = await registry.execute(tool_id, args, run_id=run.id)
            run.tools_used.append(tool_id)
            if result.ok:
                tool_context.append({"role": "system", "content": f"Tool {tool_id} result: {result.output}"})
                yield sse_format("tool.completed", {"tool_id": tool_id, "summary": str(result.output)[:120]})
            else:
                run.error = result.error
                yield sse_format("tool.completed", {"tool_id": tool_id, "summary": f"failed: {result.error}"})

        messages = messages + tool_context
        accumulated = []
        interrupted = False
        try:
            async for chunk in self.llm.stream(
                messages, model=payload.model, temperature=temperature, max_tokens=max_tokens, config=llm_config
            ):
                accumulated.append(chunk)
                yield sse_format("agent.message", {"content": chunk})
        except asyncio.CancelledError:  # client disconnected mid-stream
            interrupted = True
            raise
        except Exception as exc:  # noqa: BLE001
            yield sse_format("agent.error", {"message": str(exc)})
            run.status = "failed"
            run.error = str(exc)
            await self.db.commit()
            return
        finally:
            # Always release the conversation regardless of how streaming ended.
            conv.status = "idle"
            await self.db.commit()

        answer = "".join(accumulated)
        if interrupted:
            run.status = "failed"
            run.error = "Client disconnected before completion."
        else:
            run.result = answer
            run.status = "completed"
        run.model = payload.model
        self._record_usage(run)
        run.duration_ms = int((time.monotonic() - run_started) * 1000)
        if not interrupted:
            self.db.add(Message(conversation_id=conv.id, role="assistant", content=answer))
        await self.db.commit()
        if not interrupted:
            await self._notify(run)

        if interrupted:
            return
        yield sse_format("agent.completed", {"result": answer, "run_id": run.id, "conversation_id": conv.id})

    async def _tool_loop(
        self,
        messages: list[dict],
        tools: list[str],
        run: AgentRun,
        agent,
        llm_config,
        temperature: float,
        max_tokens: int,
        holder: dict[str, Any],
    ) -> AsyncIterator[str]:
        """Runs the LLM tool-calling loop. Emits tool events as it goes; stores the final text in ``holder``."""
        loop_messages = list(messages)
        tool_schema = registry.to_openai_schema(tools)
        tool_limit = min(agent.max_steps if agent else settings.MAX_STEPS, 10)
        final_answer = ""

        for step in range(tool_limit):
            try:
                result = await self.llm.complete_with_tools(
                    loop_messages, tool_schema, temperature=temperature, max_tokens=max_tokens, config=llm_config
                )
            except Exception as exc:  # noqa: BLE001
                # fallback model retry
                if agent and agent.fallback_model:
                    fb = copy.deepcopy(llm_config)
                    fb.model = agent.fallback_model
                    try:
                        result = await self.llm.complete_with_tools(
                            loop_messages, tool_schema, temperature=temperature, max_tokens=max_tokens, config=fb
                        )
                    except Exception as exc2:  # noqa: BLE001
                        holder["error"] = str(exc2)
                        yield sse_format("agent.error", {"message": str(exc2)})
                        return
                else:
                    holder["error"] = str(exc)
                    yield sse_format("agent.error", {"message": str(exc)})
                    return

            final_answer = result.get("content") or ""
            tool_calls = result.get("tool_calls") or []
            if not tool_calls:
                holder["answer"] = final_answer
                return

            assistant_msg: dict[str, Any] = {
                "role": "assistant",
                "content": final_answer,
                "tool_calls": [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])},
                    }
                    for tc in tool_calls
                ],
            }
            loop_messages.append(assistant_msg)

            for tc in tool_calls:
                tool_id = tc["name"]
                args = tc["arguments"]
                yield sse_format("tool.started", {"tool_id": tool_id, "args": args})
                tool = registry.get(tool_id)
                # Human-in-the-loop gate for sensitive tools.
                if tool and tool.requires_approval:
                    approval_holder: dict[str, Any] = {"approved": False}
                    async for ev in self._request_approval(run.id, tool_id, args, approval_holder, reason=tool.description or ""):
                        yield ev
                    if not approval_holder.get("approved"):
                        loop_messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc["id"],
                                "content": json.dumps({"ok": False, "output": None, "error": "Action rejected by the user."}),
                            }
                        )
                        yield sse_format("tool.completed", {"tool_id": tool_id, "summary": "rejected by user"})
                        continue
                try:
                    tool_result = await registry.execute(tool_id, args, run_id=run.id)
                except Exception as exc:  # noqa: BLE001
                    tool_result = type("R", (), {"ok": False, "output": None, "error": str(exc)})()
                run.tools_used.append(tool_id)
                if tool_result.ok:
                    yield sse_format("tool.completed", {"tool_id": tool_id, "summary": str(tool_result.output)[:120]})
                else:
                    yield sse_format("tool.completed", {"tool_id": tool_id, "summary": f"failed: {tool_result.error}"})
                loop_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"ok": tool_result.ok, "output": tool_result.output, "error": tool_result.error}),
                    }
                )
        holder["answer"] = final_answer or None
        return

    async def _make_plan(self, goal: str) -> list[str]:
        try:
            from app.agents.planner import PlannerAgent

            planner = PlannerAgent(self.llm)
            return await planner.plan(goal)
        except Exception:  # noqa: BLE001
            return ["Analyze request", "Gather context", "Execute work", "Review"]

    @staticmethod
    def _auto_args(tool_id: str, message: str) -> dict | None:
        if tool_id == "web_search":
            return {"query": message[:200]}
        if tool_id == "calculator":
            expr = message.strip()
            if expr and all(c in "0123456789+-*/(). " for c in expr):
                return {"expression": expr}
            return None
        # code/file/http tools need explicit args from the LLM tool-calling loop
        return None

    @staticmethod
    def _title(message: str) -> str:
        return (message.strip().splitlines()[0][:60] + "…") if len(message) > 60 else message.strip()[:60] or "New chat"