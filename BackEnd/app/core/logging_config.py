"""Structured logging configuration for ScriptDNA.

Provides JSON-formatted logs with context fields for easier debugging
without leaking sensitive data (prompts, tokens, PII).
"""

import logging
import json
import sys
from datetime import datetime, timezone


class StructuredFormatter(logging.Formatter):
    """Outputs each log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Merge extra structured fields if present
        for key in ("user_id", "agent", "task_id", "short_id", "script_id",
                     "duration_ms", "status", "step", "error"):
            val = getattr(record, key, None)
            if val is not None:
                entry[key] = str(val) if not isinstance(val, (str, int, float, bool)) else val

        if record.exc_info and record.exc_info[1]:
            entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(entry, ensure_ascii=False, default=str)


def setup_logging(level: str = "INFO", json_format: bool = True) -> None:
    """Configure root logger. Call once at app startup."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates on reload
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if json_format:
        handler.setFormatter(StructuredFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)-8s [%(name)s] %(message)s"
        ))

    root.addHandler(handler)

    # Quiet noisy libraries
    for lib in ("httpx", "httpcore", "urllib3", "sqlalchemy.engine", "celery.worker"):
        logging.getLogger(lib).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Convenience wrapper that returns a named logger."""
    return logging.getLogger(name)
