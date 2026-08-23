import json
import time

from app.agents.base import BaseAgent, Step
from app.core.config import settings
from app.services.llm import LLMService


class PlannerAgent(BaseAgent):
    id = "planner"
    name = "Planner"
    icon = "🗺️"
    description = "Breaks goals into actionable steps."
    system_prompt = (
        "You are a planning agent. Decompose the user's goal into a concise numbered plan "
        "of at most 6 actionable steps. Output ONLY a JSON array of strings, no prose."
    )

    async def plan(self, goal: str) -> list[str]:
        step = self.add_step("Creating plan")
        started = time.monotonic()
        try:
            reply = await self.llm.complete(
                [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": goal},
                ],
                temperature=0.2,
                max_tokens=512,
            )
            cleaned = reply.strip().lstrip("```json").rstrip("```").strip()
            steps = json.loads(cleaned)
            if not isinstance(steps, list):
                raise ValueError("not a list")
        except Exception:  # noqa: BLE001 - fallback plan
            steps = ["Analyze the request", "Gather relevant context", "Execute the core work", "Review and finalize"]
        step.status = "completed"
        step.duration_ms = int((time.monotonic() - started) * 1000)
        return steps


class ResearchAgent(BaseAgent):
    id = "research"
    name = "Research Agent"
    icon = "🔎"
    description = "Searches the web and synthesizes findings."
    system_prompt = (
        "You are a research agent. Search for up-to-date information, evaluate sources critically, "
        "and deliver a clear, well-structured summary with citations where possible. "
        "Use the web_search tool when current facts are required."
    )
    default_tools = ["web_search", "calculator"]


class CodingAgent(BaseAgent):
    id = "coding"
    name = "Coding Agent"
    icon = "💻"
    description = "Reads, writes, and tests code."
    system_prompt = (
        "You are a senior software engineer agent. Write clean, typed, testable code. "
        "When asked to run or verify code, use the code_executor tool. Explain your reasoning briefly."
    )
    default_tools = ["code_executor", "file_reader", "file_writer"]


class DataAnalystAgent(BaseAgent):
    id = "data_analyst"
    name = "Data Analyst"
    icon = "📊"
    description = "Analyzes data, computes statistics, and generates charts."
    system_prompt = (
        "You are a data analyst agent. Inspect the data, compute relevant statistics, identify trends, "
        "and explain findings in plain language. Use the code_executor tool for computation."
    )
    default_tools = ["code_executor", "file_reader"]


class WritingAgent(BaseAgent):
    id = "writing"
    name = "Writing Agent"
    icon = "✍️"
    description = "Drafts, rewrites, and summarizes content."
    system_prompt = (
        "You are a professional writing agent. Produce clear, well-structured, publication-ready content. "
        "Match the requested tone, length, and format."
    )


class ProjectManagerAgent(BaseAgent):
    id = "manager"
    name = "Manager Agent"
    icon = "🎯"
    description = "Plans goals, delegates subtasks, and produces final output."
    system_prompt = (
        "You are a project manager agent. Understand the user's goal, create a plan, coordinate "
        "specialist agents and tools, track progress, and produce a complete final deliverable."
    )
    default_tools = ["web_search", "calculator", "code_executor"]


def system_agents(llm: LLMService | None = None) -> list[BaseAgent]:
    llm = llm or LLMService()
    return [
        PlannerAgent(llm),
        ResearchAgent(llm),
        CodingAgent(llm),
        DataAnalystAgent(llm),
        WritingAgent(llm),
        ProjectManagerAgent(llm),
    ]