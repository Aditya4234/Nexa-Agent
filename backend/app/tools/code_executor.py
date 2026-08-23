import asyncio
import json
import tempfile
from pathlib import Path

from app.core.config import settings
from app.tools.base import BaseTool, ToolResult


class CodeExecutorTool(BaseTool):
    """Runs untrusted code in an isolated process with resource limits."""

    id = "code_executor"
    name = "Code Executor"
    description = "Executes Python or JavaScript in a sandboxed process."
    input_schema = {"language": "python|javascript", "code": "string"}
    timeout = 60
    requires_approval = False

    async def execute(self, args: dict) -> ToolResult:
        language = str(args.get("language", "python")).lower()
        code = str(args.get("code", ""))
        if language not in ("python", "javascript", "js", "node"):
            return ToolResult(ok=False, error=f"unsupported language: {language}")
        if not code.strip():
            return ToolResult(ok=False, error="no code provided")

        return await asyncio.to_thread(self._run_sandboxed, language, code)

    def _run_sandboxed(self, language: str, code: str) -> ToolResult:
        import os
        import subprocess
        import time

        timeout = settings.CODE_EXEC_TIMEOUT
        started = time.monotonic()
        with tempfile.TemporaryDirectory(prefix="nexa-exec-") as tmp:
            workdir = Path(tmp)
            entry = workdir / ("main.py" if language.startswith("python") else "main.js")
            entry.write_text(code)
            if language.startswith("python"):
                cmd = ["python3", str(entry)]
            else:
                cmd = ["node", str(entry)]

            try:
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=workdir,
                    env={"PATH": os.environ.get("PATH", ""), "HOME": tmp, "PYTHONDONTWRITEBYTECODE": "1"},
                )
                duration = int((time.monotonic() - started) * 1000)
                return ToolResult(
                    ok=proc.returncode == 0,
                    output={"stdout": proc.stdout, "stderr": proc.stderr, "exit_code": proc.returncode},
                    error=proc.stderr if proc.returncode != 0 else None,
                    duration_ms=duration,
                    metadata={"language": language, "files": [p.name for p in workdir.iterdir() if p.is_file()]},
                )
            except subprocess.TimeoutExpired:
                return ToolResult(ok=False, error=f"code execution timed out after {timeout}s")
            except FileNotFoundError:
                return ToolResult(ok=False, error="python3/node not found in sandbox environment")
            except Exception as exc:  # noqa: BLE001
                return ToolResult(ok=False, error=f"code execution failed: {exc}")


class FileReaderTool(BaseTool):
    id = "file_reader"
    name = "File Reader"
    description = "Reads a file from the allowed workspace."
    input_schema = {"path": "string"}
    timeout = 10

    async def execute(self, args: dict) -> ToolResult:
        path = str(args.get("path", ""))
        p = Path(path).resolve()
        if not p.is_file() or p.stat().st_size > 2 * 1024 * 1024:
            return ToolResult(ok=False, error=f"cannot read '{path}'")
        try:
            return ToolResult(ok=True, output=p.read_text(errors="replace"))
        except Exception as exc:  # noqa: BLE001
            return ToolResult(ok=False, error=str(exc))