import ipaddress
import socket
from urllib.parse import urlparse

import httpx

from app.tools.base import BaseTool, ToolResult


class HttpRequestTool(BaseTool):
    """Makes safe HTTP requests to public endpoints. SSRF-protected against private/loopback hosts."""

    id = "http_request"
    name = "HTTP Request"
    description = "Fetches a public URL or calls a public JSON API (GET/POST)."
    input_schema = {"method": "GET|POST", "url": "string", "headers": "object", "body": "object"}
    timeout = 20

    BLOCKED_IPS = {"0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.168.0.0/16", "198.18.0.0/15", "224.0.0.0/4", "240.0.0.0/4", "::1/128", "fc00::/7", "fe80::/10", "ff00::/8"}

    async def execute(self, args: dict) -> ToolResult:
        method = str(args.get("method", "GET")).upper()
        url = str(args.get("url", "")).strip()
        if method not in ("GET", "POST"):
            return ToolResult(ok=False, error="http_request: only GET/POST are supported")
        if not url.startswith(("http://", "https://")):
            return ToolResult(ok=False, error="http_request: url must start with http:// or https://")

        parsed = urlparse(url)
        host = parsed.hostname or ""
        if self._is_blocked(host):
            return ToolResult(ok=False, error=f"http_request: access to '{host}' is not allowed")

        headers = dict(args.get("headers") or {})
        body = args.get("body")
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                if method == "GET":
                    resp = await client.get(url, headers=headers)
                else:
                    resp = await client.post(url, headers=headers, json=body if body is not None else None)
                content = resp.text[:8000]
                return ToolResult(
                    ok=resp.status_code < 400,
                    output={"status_code": resp.status_code, "headers": dict(list(resp.headers.items())[:12]), "body": content},
                    error=f"HTTP {resp.status_code}" if resp.status_code >= 400 else None,
                )
        except Exception as exc:  # noqa: BLE001
            return ToolResult(ok=False, error=f"http_request failed: {exc}")

    @staticmethod
    def _is_blocked(host: str) -> bool:
        if host in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return True
        try:
            infos = socket.getaddrinfo(host, None)
        except socket.gaierror:
            return True
        for info in infos:
            ip = info[4][0]
            try:
                ip_obj = ipaddress.ip_address(ip)
                if (
                    ip_obj.is_loopback
                    or ip_obj.is_private
                    or ip_obj.is_link_local
                    or ip_obj.is_reserved
                    or ip_obj.is_multicast
                    or ip_obj.is_unspecified
                ):
                    return True
            except ValueError:
                return True
        return False