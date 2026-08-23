import json
import logging
import sys
import uuid
from datetime import datetime, timezone
from typing import Any

LOG_RECORD_BUILTIN_ATTRS = {
    "args", "asctime", "created", "exc_info", "exc_text", "filename",
    "funcName", "levelname", "levelno", "lineno", "module", "msecs",
    "message", "msg", "name", "pathname", "process", "processName",
    "relativeCreated", "stack_info", "thread", "threadName", "taskName",
}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": getattr(record, "trace_id", None),
            "user_id": getattr(record, "user_id", None),
            "run_id": getattr(record, "run_id", None),
        }
        for key, value in record.__dict__.items():
            if key not in LOG_RECORD_BUILTIN_ATTRS and not key.startswith("_"):
                entry[key] = value
        if record.exc_info:
            entry["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(entry, default=str)


def setup_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)


def make_trace_id() -> str:
    return uuid.uuid4().hex[:16]


def log_event(logger: logging.Logger, level: str, message: str, **context: Any) -> None:
    extra = {}
    if "trace_id" in context:
        extra["trace_id"] = context.pop("trace_id")
    if "user_id" in context:
        extra["user_id"] = context.pop("user_id")
    if "run_id" in context:
        extra["run_id"] = context.pop("run_id")
    logger.log(getattr(logging, level.upper()), message, extra=extra)
    for key, value in context.items():
        logger.debug(f"ctx {key}={value}", extra=extra)