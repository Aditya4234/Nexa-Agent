"""AI Website Builder service: turns a natural-language prompt into a complete,
single-file website (HTML + CSS + JS) using the configured LLM."""

import re
from typing import AsyncIterator

from app.models.user import User
from app.services.llm import llm
from app.services.llm_config import resolve_config

SYSTEM_PROMPT = """You are an expert web designer and front-end engineer.
The user describes a website; you return ONE complete, production-quality, self-contained HTML file.

STRICT RULES:
1. Output ONLY the HTML code. No explanations, no markdown fences, no commentary.
2. The file MUST start with <!DOCTYPE html> and end with </html>.
3. ALL CSS must be inside a <style> tag in the head; ALL JavaScript inside a <script> tag before </body>.
4. No external files except Google Fonts via <link> and icon libraries via CDN (e.g. Font Awesome). Prefer inline SVG icons when possible.
5. Use images from https://picsum.photos/seed/<word>/<w>/<h> or inline SVG placeholders — never broken links.
6. Modern, beautiful design: responsive (mobile-first), smooth scroll, hover effects, subtle animations, good typography, consistent color palette, generous whitespace.
7. Include a sticky navbar, hero section, and a footer at minimum. Add sections the request implies (features, pricing, gallery, contact form, etc.).
8. Make interactive elements actually work with vanilla JS (mobile menu toggle, smooth scrolling, form validation with a success message, tabs, sliders, counters).
9. Write real, meaningful copy for the requested topic — never lorem ipsum.

Return the complete file in one response."""

REVISE_PROMPT = """You are an expert web designer editing an existing single-file website.
Apply the user's requested change to the CURRENT website and return the FULL updated HTML file.

STRICT RULES:
1. Output ONLY the HTML code. No explanations, no markdown fences.
2. The file MUST start with <!DOCTYPE html> and end with </html>.
3. Keep everything that was not asked to change intact.
4. Preserve the same quality bar: responsive, animated, modern."""


def extract_html(text: str) -> str:
    """Extract a full HTML document from raw LLM output (handles markdown fences)."""
    text = text.strip()
    fence = re.search(r"```(?:html)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.lower().find("<!doctype html")
    if start == -1:
        start = text.lower().find("<html")
    end = text.lower().rfind("</html>")
    if start != -1 and end != -1:
        return text[start : end + 7]
    return text


def _mock_site(prompt: str) -> str:
    title = prompt.strip()[:60] or "My Website"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }}
  .hero {{ min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem;
          background: radial-gradient(circle at 30% 20%, rgba(139,92,246,.25), transparent 50%), radial-gradient(circle at 70% 80%, rgba(59,130,246,.25), transparent 50%); }}
  h1 {{ font-size: clamp(2rem, 6vw, 4rem); background: linear-gradient(90deg, #a78bfa, #60a5fa); -webkit-background-clip: text; background-clip: text; color: transparent; max-width: 900px; }}
  p {{ margin-top: 1rem; color: #94a3b8; max-width: 600px; }}
  .cta {{ margin-top: 2rem; padding: .9rem 2rem; border-radius: 999px; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; color: white;
         background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: transform .2s; }}
  .cta:hover {{ transform: translateY(-2px); }}
</style>
</head>
<body>
  <section class="hero">
    <h1>{title}</h1>
    <p>This is a preview site generated in mock mode because no LLM API key is configured. Add your API key in Settings → LLM Provider to generate real websites.</p>
    <button class="cta" onclick="alert('Connect an LLM key to build real sites!')">Get Started</button>
  </section>
</body>
</html>"""


async def stream_generation(user: User, prompt: str) -> AsyncIterator[str]:
    """Yield the generated website HTML chunk by chunk."""
    cfg = resolve_config(user)
    if not cfg.available:
        html = _mock_site(prompt)
        for i in range(0, len(html), 400):
            yield html[i : i + 400]
        return
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Create a complete website for this request:\n\n{prompt}"},
    ]
    async for chunk in llm.stream(messages, temperature=0.7, max_tokens=16000, config=cfg):
        yield chunk


async def stream_revision(user: User, current_html: str, instruction: str) -> AsyncIterator[str]:
    """Yield the revised website HTML chunk by chunk."""
    cfg = resolve_config(user)
    if not cfg.available:
        yield current_html
        return
    messages = [
        {"role": "system", "content": REVISE_PROMPT},
        {
            "role": "user",
            "content": f"CURRENT WEBSITE HTML:\n```html\n{current_html}\n```\n\nREQUESTED CHANGE: {instruction}\n\nReturn the complete updated HTML file.",
        },
    ]
    async for chunk in llm.stream(messages, temperature=0.5, max_tokens=16000, config=cfg):
        yield chunk
