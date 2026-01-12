from datetime import datetime
from typing import Any, Dict, Optional
from app.core.mongodb import mongodb
import uuid

class AILogger:
    @staticmethod
    async def log_event(
        event_type: str,
        user_id: int,
        session_id: Optional[str] = None,
        details: Dict[str, Any] = None,
        model: Optional[str] = None
    ):
        """
        Log AI events (prompts, responses, tool calls, agent traces) to MongoDB.
        """
        if mongodb.db is None:
            return

        log_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(),
            "event_type": event_type,
            "user_id": user_id,
            "session_id": session_id,
            "model": model,
            "details": details or {}
        }

        await mongodb.db.ai_logs.insert_one(log_entry)

ai_logger = AILogger()
