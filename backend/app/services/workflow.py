"""Multi-agent workflow orchestration: Manager agent + specialist agents."""

import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.agent import AgentRun
from app.models.conversation import Conversation, Message
from app.services.llm import LLMService
from app.services.llm_config import RuntimeLLMConfig
from app.services.usage import estimate_cost
from app.tools.registry import registry

SPECIALISTS = {
    "RESEARCH": {
        "name": "Research Agent",
        "prompt": "You are a RESEARCH specialist agent. Use web_search to find current, accurate information, then summarize findings for the task.",
        "tools": ["web_search"],
    },
    "CODING": {
        "name": "Coding Agent",
        "prompt": "You are a CODING specialist agent. Write and test code using code_executor to solve the task. Show working output.",
        "tools": ["code_executor"],
    },
    "DATA": {
        "name": "Data Agent",
        "prompt": "You are a DATA specialist agent. Use the calculator and http_request tools to fetch and analyze data for the task.",
        "tools": ["calculator", "http_request"],
    },
}

MANAGER_PROMPT = (
    "You are the MANAGER of a team of specialist AI agents. Decompose the user's goal into 2-3 clear subtasks, "
    "assigning each to exactly one specialist. Respond ONLY with a JSON array of objects, no markdown:\n"
    '[{"specialist": "RESEARCH|CODING|DATA", "task": "clear subtask description"}]'
)


class WorkflowService:
    def __init__(self, db: AsyncSession, user_id: int) -> None:
        self.db = db
        self.user_id = user_id
        self.llm = LLMService()

    async def run(self, goal: str, llm_config: RuntimeLLMConfig | None, agent_id: int | None = None) -> dict:
        run = AgentRun(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            user_id=self.user_id,
            status="running",
            input=goal,
        )
        self.db.add(run)
        await self.db.commit()

        conv = Conversation(user_id=self.user_id, title=goal[:60], model="default", agent_id=agent_id)
        self.db.add(conv)
        await self.db.flush()
        self.db.add(Message(conversation_id=conv.id, role="user", content=goal))
        await self.db.commit()

        steps = [{"name": "Manager decomposes the goal", "status": "completed"}]
        specialist_outputs: dict[str, str] = {}

        if not llm_config or not llm_config.available:
            # Mock mode: simulate the orchestration.
            plan = [
                {"specialist": "RESEARCH", "task": f"Research context for: {goal[:120]}"},
                {"specialist": "CODING", "task": f"Implement the solution for: {goal[:120]}"},
                {"specialist": "DATA", "task": f"Validate the result for: {goal[:120]}"},
            ]
            for item in plan:
                spec = SPECIALISTS[item["specialist"]]
                steps.append({"name": f"{spec['name']} — {item['task'][:80]}", "status": "completed"})
                specialist_outputs[item["specialist"]] = f"[mock] {spec['name']} completed: {item['task']}"
        else:
            # 1) Manager plans.
            try:
                plan = await self._manager_plan(goal, llm_config)
            except Exception:  # noqa: BLE001
                plan = [
                    {"specialist": "RESEARCH", "task": goal},
                    {"specialist": "CODING", "task": goal},
                    {"specialist": "DATA", "task": goal},
                ]

            # 2) Specialists execute in parallel.
            import asyncio

            results = await asyncio.gather(*[self._specialist(item, llm_config) for item in plan])
            for item, (ok, output, error) in zip(plan, results):
                name = SPECIALISTS.get(item.get("specialist"), {}).get("name", "Agent")
                steps.append({"name": f"{name} — {str(item.get('task'))[:80]}", "status": "completed" if ok else "failed"})
                specialist_outputs[item.get("specialist", "RESEARCH")] = output if ok else f"error: {error}"

            # 3) Manager synthesizes.
            synth = await self._synthesize(goal, specialist_outputs, llm_config)
            steps.append({"name": "Manager synthesizes the final result", "status": "completed"})

        result = self._compose_result(goal, specialist_outputs, steps)

        run.steps = steps
        run.result = result
        run.status = "completed"
        run.model = llm_config.resolved_model if llm_config else ""
        run.tokens = self.llm.last_usage.get("total_tokens", 0)
        run.cost = round(estimate_cost(run.model or "default", self.llm.last_usage.get("prompt_tokens", 0), self.llm.last_usage.get("completion_tokens", 0)), 6)
        self.db.add(Message(conversation_id=conv.id, role="assistant", content=result))
        await self.db.commit()

        return {
            "run_id": run.id,
            "conversation_id": conv.id,
            "status": run.status,
            "steps": steps,
            "specialist_outputs": specialist_outputs,
            "result": result,
            "model": run.model,
            "tokens": run.tokens,
            "cost": run.cost,
        }

    async def _manager_plan(self, goal: str, llm_config: RuntimeLLMConfig) -> list[dict]:
        raw = await self.llm.complete(
            [{"role": "system", "content": MANAGER_PROMPT}, {"role": "user", "content": goal}],
            config=llm_config,
            temperature=0.2,
            max_tokens=800,
        )
        cleaned = raw.strip().strip("`").strip()
        start, end = cleaned.find("["), cleaned.rfind("]")
        if start == -1 or end == -1:
            raise ValueError("Manager did not return a plan array")
        plan = json.loads(cleaned[start : end + 1])
        normalized = []
        for item in plan[:4]:
            spec = str(item.get("specialist", "RESEARCH")).upper()
            if spec not in SPECIALISTS:
                spec = "RESEARCH"
            normalized.append({"specialist": spec, "task": str(item.get("task", goal))[:500]})
        return normalized or [{"specialist": "RESEARCH", "task": goal}]

    async def _specialist(self, item: dict, llm_config: RuntimeLLMConfig) -> tuple[bool, str, str]:
        spec = SPECIALISTS.get(str(item.get("specialist", "RESEARCH")).upper(), SPECIALISTS["RESEARCH"])
        task = str(item.get("task", ""))
        messages = [
            {"role": "system", "content": spec["prompt"]},
            {"role": "user", "content": task},
        ]
        tool_schema = registry.to_openai_schema(spec["tools"])
        max_steps = 4
        final = ""
        for _ in range(max_steps):
            result = await self.llm.complete_with_tools(messages, tool_schema, config=llm_config, temperature=0.3, max_tokens=1200)
            final = result.get("content") or ""
            tool_calls = result.get("tool_calls") or []
            if not tool_calls:
                break
            assistant_msg = {
                "role": "assistant",
                "content": final,
                "tool_calls": [
                    {"id": tc["id"], "type": "function", "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])}}
                    for tc in tool_calls
                ],
            }
            messages.append(assistant_msg)
            for tc in tool_calls:
                try:
                    tr = await registry.execute(tc["name"], tc["arguments"], run_id="")
                except Exception as exc:  # noqa: BLE001
                    tr = type("R", (), {"ok": False, "output": None, "error": str(exc)})()
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"ok": tr.ok, "output": tr.output, "error": tr.error}),
                    }
                )
        return True, final or "(no output)", ""

    async def _synthesize(self, goal: str, outputs: dict[str, str], llm_config: RuntimeLLMConfig) -> str:
        blocks = "\n\n".join(f"[{k}]\n{v}" for k, v in outputs.items() if v)
        prompt = (
            "You are the MANAGER. Using the specialist outputs below, write the final polished answer to the user's goal. "
            "Synthesize, do not simply repeat. Include key findings and any code/data results.\n\n"
            f"GOAL: {goal}\n\nSPECIALIST OUTPUTS:\n{blocks}"
        )
        return await self.llm.complete([{"role": "user", "content": prompt}], config=llm_config, temperature=0.3, max_tokens=1800)

    @staticmethod
    def _compose_result(goal: str, outputs: dict[str, str], steps: list[dict]) -> str:
        parts = [f"**Goal:** {goal}", ""]
        for label, name in (("RESEARCH", "🔎 Research"), ("CODING", "💻 Coding"), ("DATA", "📊 Data")):
            if outputs.get(label):
                parts.append(f"## {name}\n{outputs[label]}")
        return "\n".join(parts)