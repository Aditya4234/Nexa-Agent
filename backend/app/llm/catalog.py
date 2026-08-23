"""Model catalog for the AgentX AI Model Router.

Each entry describes capabilities, cost, latency tier and context window so the
router can pick the cheapest capable model for a given task profile.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

MODEL_CATALOG: dict[str, dict[str, Any]] = {
    # ---- OpenAI ----
    "gpt-5-mini": {
        "provider": "openai",
        "capabilities": ["text", "coding", "vision", "tools"],
        "coding": 0.75,
        "reasoning": 0.5,
        "context": 128000,
        "cost_per_1m_prompt": 0.25,
        "cost_per_1m_completion": 2.0,
        "latency": "fast",
    },
    "gpt-5": {
        "provider": "openai",
        "capabilities": ["text", "coding", "vision", "tools"],
        "coding": 0.9,
        "reasoning": 0.85,
        "context": 128000,
        "cost_per_1m_prompt": 1.25,
        "cost_per_1m_completion": 10.0,
        "latency": "medium",
    },
    "o4-mini": {
        "provider": "openai",
        "capabilities": ["text", "reasoning"],
        "coding": 0.8,
        "reasoning": 0.95,
        "context": 200000,
        "cost_per_1m_prompt": 1.1,
        "cost_per_1m_completion": 4.4,
        "latency": "medium",
    },
    # ---- Anthropic ----
    "claude-sonnet-4-5": {
        "provider": "anthropic",
        "capabilities": ["text", "coding", "vision", "tools"],
        "coding": 0.9,
        "reasoning": 0.85,
        "context": 200000,
        "cost_per_1m_prompt": 3.0,
        "cost_per_1m_completion": 15.0,
        "latency": "medium",
    },
    "claude-opus-4-5": {
        "provider": "anthropic",
        "capabilities": ["text", "coding", "vision", "tools"],
        "coding": 0.95,
        "reasoning": 0.95,
        "context": 200000,
        "cost_per_1m_prompt": 15.0,
        "cost_per_1m_completion": 75.0,
        "latency": "slow",
    },
    # ---- Google Gemini ----
    "gemini-2.5-flash": {
        "provider": "gemini",
        "capabilities": ["text", "coding", "vision", "tools", "long_context"],
        "coding": 0.8,
        "reasoning": 0.7,
        "context": 1000000,
        "cost_per_1m_prompt": 0.3,
        "cost_per_1m_completion": 2.5,
        "latency": "fast",
    },
    "gemini-2.5-pro": {
        "provider": "gemini",
        "capabilities": ["text", "coding", "vision", "tools", "long_context"],
        "coding": 0.9,
        "reasoning": 0.95,
        "context": 2000000,
        "cost_per_1m_prompt": 1.25,
        "cost_per_1m_completion": 10.0,
        "latency": "medium",
    },
    # ---- Local / open-source (OpenAI-compatible endpoints: Ollama, vLLM, LM Studio) ----
    "llama-3.3-70b": {
        "provider": "local",
        "capabilities": ["text", "coding", "tools"],
        "coding": 0.7,
        "reasoning": 0.7,
        "context": 131072,
        "cost_per_1m_prompt": 0.0,
        "cost_per_1m_completion": 0.0,
        "latency": "fast",
    },
    "qwen2.5-coder-32b": {
        "provider": "local",
        "capabilities": ["text", "coding", "tools"],
        "coding": 0.85,
        "reasoning": 0.6,
        "context": 131072,
        "cost_per_1m_prompt": 0.0,
        "cost_per_1m_completion": 0.0,
        "latency": "fast",
    },
}

DEFAULT_MODEL = "gpt-5-mini"


def provider_models(provider: str) -> list[dict]:
    return [{"id": mid, **meta} for mid, meta in MODEL_CATALOG.items() if meta["provider"] == provider]


def load_catalog() -> dict[str, dict]:
    """Optionally merge a user-defined catalog JSON (overrides defaults)."""
    catalog = dict(MODEL_CATALOG)
    path = Path("data/model_catalog.json")
    if path.exists():
        try:
            custom = json.loads(path.read_text())
            if isinstance(custom, dict):
                catalog.update(custom)
        except Exception:  # noqa: BLE001
            pass
    return catalog


def find_model(model_id: str) -> dict | None:
    return load_catalog().get(model_id)