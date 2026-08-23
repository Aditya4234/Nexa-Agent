import asyncio
import json
from typing import Any, AsyncIterator

import httpx

from app.core.config import settings
from app.core.exceptions import LLMError
from app.services.llm_config import RuntimeLLMConfig


class LLMService:
    """Async LLM abstraction. Supports OpenAI-compatible APIs, Anthropic, and a local mock.

    A ``RuntimeLLMConfig`` may be passed to override global settings (per-user providers).
    """

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None
        self.last_usage: dict[str, int] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=120)
        return self._client

    @staticmethod
    def _is_mock(config: RuntimeLLMConfig | None) -> bool:
        if config is not None:
            return not config.available
        return not settings.llm_available

    # ---- top-level API ----

    async def complete(
        self,
        messages: list[dict],
        model: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        config: RuntimeLLMConfig | None = None,
    ) -> str:
        cfg = config or self._resolve_global()
        if self._is_mock(config):
            return await self._mock_complete(messages)
        if cfg.provider == "anthropic":
            return await self._anthropic_complete(messages, cfg, temperature, max_tokens)
        return await self._openai_complete(messages, cfg, temperature, max_tokens)

    async def stream(
        self,
        messages: list[dict],
        model: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        config: RuntimeLLMConfig | None = None,
    ) -> AsyncIterator[str]:
        cfg = config or self._resolve_global()
        if self._is_mock(config):
            async for chunk in self._mock_stream(messages):
                yield chunk
            return
        if cfg.provider == "anthropic":
            async for chunk in self._anthropic_stream(messages, cfg, temperature, max_tokens):
                yield chunk
            return
        async for chunk in self._openai_stream(messages, cfg, temperature, max_tokens):
            yield chunk

    async def complete_with_tools(
        self,
        messages: list[dict],
        tools: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        config: RuntimeLLMConfig | None = None,
    ) -> dict[str, Any]:
        """Non-streaming call that may return tool_calls. Used in the tool-calling loop.

        Returns {"content": str, "tool_calls": [{"id","name","arguments"}], "stop_reason": str}.
        """
        cfg = config or self._resolve_global()
        if self._is_mock(config) or not tools:
            text = await self._mock_complete(messages)
            return {"content": text, "tool_calls": [], "stop_reason": "stop"}
        if cfg.provider == "anthropic":
            return await self._anthropic_tool_call(messages, tools, cfg, temperature, max_tokens)
        return await self._openai_tool_call(messages, tools, cfg, temperature, max_tokens)

    async def embed(self, texts: list[str], config: RuntimeLLMConfig | None = None) -> list[list[float]]:
        """Embed a list of texts. Returns an empty list per text when no OpenAI key is available."""
        cfg = config or self._resolve_global()
        if not cfg.api_key:
            return []
        if cfg.provider == "anthropic":
            return []
        url = f"{cfg.base_url.rstrip('/')}/embeddings" if cfg.base_url else "https://api.openai.com/v1/embeddings"
        try:
            resp = await self.client.post(
                url,
                headers={"Authorization": f"Bearer {cfg.api_key}"},
                json={"model": cfg.resolved_embedding_model, "input": texts},
            )
            resp.raise_for_status()
            data = resp.json()
            ordered = sorted(data.get("data", []), key=lambda d: d.get("index", 0))
            return [item["embedding"] for item in ordered]
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Embedding request failed: {exc}") from exc

    # ---- helpers ----

    def _resolve_global(self) -> RuntimeLLMConfig:
        return RuntimeLLMConfig(
            provider="anthropic" if settings.ANTHROPIC_API_KEY and not settings.OPENAI_API_KEY else "openai",
            api_key=settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            model=settings.DEFAULT_MODEL,
            embedding_model=settings.EMBEDDING_MODEL,
        )

    # ---- OpenAI ----

    async def _openai_complete(self, messages: list[dict], cfg: RuntimeLLMConfig, temperature: float, max_tokens: int) -> str:
        url = f"{cfg.base_url.rstrip('/')}/chat/completions" if cfg.base_url else "https://api.openai.com/v1/chat/completions"
        try:
            resp = await self.client.post(
                url,
                headers={"Authorization": f"Bearer {cfg.api_key}"},
                json={"model": cfg.resolved_model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
            )
            resp.raise_for_status()
            data = resp.json()
            usage = data.get("usage") or {}
            self.last_usage = {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            }
            return data["choices"][0]["message"]["content"] or ""
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"OpenAI request failed: {exc}") from exc

    async def _openai_stream(self, messages: list[dict], cfg: RuntimeLLMConfig, temperature: float, max_tokens: int) -> AsyncIterator[str]:
        url = f"{cfg.base_url.rstrip('/')}/chat/completions" if cfg.base_url else "https://api.openai.com/v1/chat/completions"
        try:
            async with self.client.stream(
                "POST",
                url,
                headers={"Authorization": f"Bearer {cfg.api_key}"},
                json={"model": cfg.resolved_model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "stream": True},
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        break
                    chunk = json.loads(payload)
                    if chunk.get("usage"):
                        self.last_usage = {
                            "prompt_tokens": chunk["usage"].get("prompt_tokens", 0),
                            "completion_tokens": chunk["usage"].get("completion_tokens", 0),
                            "total_tokens": chunk["usage"].get("total_tokens", 0),
                        }
                    if not chunk.get("choices"):
                        continue
                    delta = chunk["choices"][0]["delta"].get("content")
                    if delta:
                        yield delta
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"OpenAI stream failed: {exc}") from exc

    async def _openai_tool_call(
        self,
        messages: list[dict],
        tools: list[dict],
        cfg: RuntimeLLMConfig,
        temperature: float,
        max_tokens: int,
    ) -> dict[str, Any]:
        url = f"{cfg.base_url.rstrip('/')}/chat/completions" if cfg.base_url else "https://api.openai.com/v1/chat/completions"
        try:
            resp = await self.client.post(
                url,
                headers={"Authorization": f"Bearer {cfg.api_key}"},
                json={
                    "model": cfg.resolved_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "tools": tools,
                    "tool_choice": "auto",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            message = data["choices"][0]["message"]
            usage = data.get("usage") or {}
            self.last_usage = {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            }
            tool_calls = []
            for tc in message.get("tool_calls") or []:
                try:
                    arguments = json.loads(tc.get("function", {}).get("arguments") or "{}")
                except json.JSONDecodeError:
                    arguments = {}
                tool_calls.append(
                    {
                        "id": tc.get("id", ""),
                        "name": tc.get("function", {}).get("name", ""),
                        "arguments": arguments,
                    }
                )
            return {
                "content": message.get("content") or "",
                "tool_calls": tool_calls,
                "stop_reason": data["choices"][0].get("finish_reason", "stop"),
            }
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"OpenAI tool call failed: {exc}") from exc

    # ---- Anthropic ----

    async def _anthropic_complete(self, messages: list[dict], cfg: RuntimeLLMConfig, temperature: float, max_tokens: int) -> str:
        system, conv = self._split_system(messages)
        try:
            resp = await self.client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": cfg.api_key, "anthropic-version": "2023-06-01"},
                json={"model": cfg.resolved_model, "system": system, "messages": conv, "temperature": temperature, "max_tokens": max_tokens},
            )
            resp.raise_for_status()
            data = resp.json()
            usage = data.get("usage") or {}
            self.last_usage = {
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            }
            return "".join(b.get("text", "") for b in data["content"])
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Anthropic request failed: {exc}") from exc

    async def _anthropic_stream(self, messages: list[dict], cfg: RuntimeLLMConfig, temperature: float, max_tokens: int) -> AsyncIterator[str]:
        system, conv = self._split_system(messages)
        try:
            async with self.client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": cfg.api_key, "anthropic-version": "2023-06-01"},
                json={"model": cfg.resolved_model, "system": system, "messages": conv, "temperature": temperature, "max_tokens": max_tokens, "stream": True},
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    evt = json.loads(line[5:].strip())
                    if evt.get("type") == "content_block_delta":
                        yield evt.get("delta", {}).get("text", "")
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Anthropic stream failed: {exc}") from exc

    async def _anthropic_tool_call(
        self,
        messages: list[dict],
        tools: list[dict],
        cfg: RuntimeLLMConfig,
        temperature: float,
        max_tokens: int,
    ) -> dict[str, Any]:
        # Anthropic tool calling is supported via content blocks; this maps the OpenAI-style
        # tool schema onto Anthropic's tool_use blocks.
        system, conv = self._split_system(messages)
        anthropic_tools = [
            {
                "name": t["function"]["name"],
                "description": t["function"].get("description", ""),
                "input_schema": t["function"].get("parameters", {"type": "object", "properties": {}}),
            }
            for t in tools
        ]
        try:
            resp = await self.client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": cfg.api_key, "anthropic-version": "2023-06-01"},
                json={
                    "model": cfg.resolved_model,
                    "system": system,
                    "messages": conv,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "tools": anthropic_tools,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            usage = data.get("usage") or {}
            self.last_usage = {
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            }
            content = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
            tool_calls = []
            for block in data.get("content", []):
                if block.get("type") == "tool_use":
                    tool_calls.append(
                        {
                            "id": block.get("id", ""),
                            "name": block.get("name", ""),
                            "arguments": block.get("input", {}),
                        }
                    )
            return {"content": content, "tool_calls": tool_calls, "stop_reason": data.get("stop_reason", "end_turn")}
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Anthropic tool call failed: {exc}") from exc

    @staticmethod
    def _split_system(messages: list[dict]) -> tuple[str, list[dict]]:
        system = "\n".join(m["content"] for m in messages if m["role"] == "system")
        conv = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
        return system, conv

    # ---- Mock (no API key) ----

    async def _mock_complete(self, messages: list[dict]) -> str:
        await asyncio.sleep(0.2)
        return self._mock_reply(messages)

    async def _mock_stream(self, messages: list[dict]) -> AsyncIterator[str]:
        reply = self._mock_reply(messages)
        for word in reply.split(" "):
            yield word + " "
            await asyncio.sleep(0.03)

    def _mock_reply(self, messages: list[dict]) -> str:
        last = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return (
            "I'm running in **mock mode** because no LLM API key is configured.\n\n"
            f"Your message was: *{last}*\n\n"
            "Add an API key in **Settings → LLM Provider** (or set `OPENAI_API_KEY` in `backend/.env`) "
            "to enable real model responses, tool calling, and the full agent pipeline.\n\n```\nAgentX AI is operational.\n```"
        )


llm = LLMService()