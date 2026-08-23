import asyncio

from app.tools.base import BaseTool, ToolResult


class SendEmailTool(BaseTool):
    id = "send_email"
    name = "Send Email"
    description = "Sends an email message to a recipient. Requires human approval before sending."
    input_schema = {"to": "string", "subject": "string", "body": "string"}
    timeout = 15
    requires_approval = True

    async def execute(self, args: dict) -> ToolResult:
        to = str(args.get("to", "")).strip()
        subject = str(args.get("subject", "")).strip()
        if not to or "@" not in to:
            return ToolResult(ok=False, error="send_email: a valid 'to' address is required")
        # Simulated send. In production this would call an email/SMTP provider.
        await asyncio.sleep(0.3)
        return ToolResult(
            ok=True,
            output={"sent_to": to, "subject": subject or "(no subject)", "preview": (str(args.get("body", "")))[:200]},
            metadata={"simulated": True},
        )