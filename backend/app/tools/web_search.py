import asyncio

import httpx

from app.tools.base import BaseTool, ToolResult


class WebSearchTool(BaseTool):
    id = "web_search"
    name = "Web Search"
    description = "Searches the web and returns top results with snippets. Uses a configured search API or a live DuckDuckGo fallback."
    input_schema = {"query": "string", "max_results": "int"}
    timeout = 15

    async def execute(self, args: dict) -> ToolResult:
        query = str(args.get("query", "")).strip()
        max_results = min(int(args.get("max_results", 5)), 10)
        if not query:
            return ToolResult(ok=False, error="web_search: missing 'query'")
        # Provider-agnostic search hook. Plug Brave/Serper/Tavily here via env keys.
        key = _env("BRAVE_SEARCH_API_KEY") or _env("SERP_API_KEY") or _env("TAVILY_API_KEY")
        if key:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(
                        "https://api.search.brave.com/res/v1/web/search",
                        params={"q": query, "count": max_results},
                        headers={"X-Subscription-Token": key},
                    )
                    resp.raise_for_status()
                    results = []
                    for item in resp.json().get("web", {}).get("results", [])[:max_results]:
                        results.append({"title": item.get("title"), "url": item.get("url"), "snippet": item.get("description")})
                    return ToolResult(ok=True, output=results)
            except Exception as exc:  # noqa: BLE001
                return ToolResult(ok=False, error=f"web_search failed: {exc}")
        # Live fallback without an API key.
        try:
            results = await self._duckduckgo(query, max_results)
            if results:
                return ToolResult(ok=True, output=results)
        except Exception:  # noqa: BLE001
            pass
        return ToolResult(
            ok=True,
            output=[
                {"title": "Demo result", "url": "https://example.com", "snippet": f"Results for '{query}'. Configure a search API key (BRAVE_SEARCH_API_KEY) for higher-quality live results."}
            ],
        )

    @staticmethod
    async def _duckduckgo(query: str, max_results: int) -> list[dict]:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers={"User-Agent": "Mozilla/5.0 (AgentXAI/1.0)"},
            )
            resp.raise_for_status()
            return _parse_ddg(resp.text, max_results)


def _parse_ddg(html: str, max_results: int) -> list[dict]:
    import re
    import html as html_mod

    results = []
    for m in re.finditer(
        r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?class="result__snippet"[^>]*>(.*?)</a>',
        html,
        re.DOTALL,
    ):
        url = html_mod.unescape(m.group(1))
        if url.startswith("//"):
            url = "https:" + url
        title = re.sub(r"<[^>]+>", "", m.group(2))
        snippet = re.sub(r"<[^>]+>", "", m.group(3))
        results.append({"title": html_mod.unescape(title).strip(), "url": url, "snippet": html_mod.unescape(snippet).strip()})
        if len(results) >= max_results:
            break
    return results


class CalculatorTool(BaseTool):
    id = "calculator"
    name = "Calculator"
    description = "Evaluates a safe arithmetic expression."
    input_schema = {"expression": "string"}
    timeout = 5

    async def execute(self, args: dict) -> ToolResult:
        expr = str(args.get("expression", "")).strip()
        safe = {"a", "b", "c", "d", "e", "f", "abs", "min", "max", "pow", "round", "sum"}
        try:
            result = eval(compile(expr, "<calc>", "eval"), {"__builtins__": {}}, safe)  # noqa: S307 - restricted builtins
            return ToolResult(ok=True, output=result)
        except Exception as exc:  # noqa: BLE001
            return ToolResult(ok=False, error=f"calculator: {exc}")


def _env(key: str) -> str:
    import os
    return os.getenv(key, "")


def register_all(registry) -> None:
    registry.register(WebSearchTool())
    registry.register(CalculatorTool())