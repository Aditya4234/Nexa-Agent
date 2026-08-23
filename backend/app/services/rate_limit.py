"""In-memory sliding-window rate limiter keyed by user id."""

import threading
import time
from collections import deque
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class Allowance:
    allowed: bool
    retry_after: float = 0.0


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int | None = None, window: int | None = None) -> Allowance:
        now = time.monotonic()
        limit = limit or self.limit
        window = window or self.window
        with self._lock:
            q = self._hits.setdefault(key, deque())
            while q and q[0] < now - window:
                q.popleft()
            if len(q) >= limit:
                oldest = q[0] if q else now
                return Allowance(allowed=False, retry_after=round(max(oldest + window - now, 0.0), 1))
            q.append(now)
            return Allowance(allowed=True)

    def is_allowed(self, key: str, limit: int | None = None, window: int | None = None) -> Allowance:
        return self.allow(key, limit=limit, window=window)


rate_limiter = SlidingWindowLimiter(limit=settings.RATE_LIMIT_REQUESTS, window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS)