import os
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.agents.wellbeing_agent import wellbeing_agent
from app.api.v1.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.schemas.wellbeing_agent import (
    PomodoroSession,
    PomodoroSessionResponse,
    WellbeingCheck,
    WellbeingEventLog,
    WellbeingEventLogResponse,
)

router = APIRouter()


def _is_enabled() -> bool:
    return os.getenv("WELLBEING_AGENT_ENABLED", "true").lower() not in {"0", "false", "no", "off"}


def _compact_context(context: Dict[str, Any]) -> Dict[str, Any]:
    allowed_keys = {"page", "active_tab", "dataset_id", "stress_score_snapshot", "status", "action"}
    compact: Dict[str, Any] = {}
    for key, value in context.items():
        if key not in allowed_keys:
            continue
        if isinstance(value, str):
            compact[key] = value[:120]
        elif isinstance(value, (int, float, bool)) or value is None:
            compact[key] = value
    return compact


async def _write_event(user_id: int, event_type: str, context: Dict[str, Any]) -> None:
    if mongodb.db is None:
        return
    try:
        await mongodb.db.wellbeing_events.insert_one(
            {
                "user_id": user_id,
                "event_type": event_type,
                "context": _compact_context(context),
                "created_at": datetime.utcnow(),
            }
        )
    except Exception:
        return


@router.get("/check", response_model=WellbeingCheck)
async def check_wellbeing(
    period: str = Query(default="24h", pattern="^(24h|7d|30d)$"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WellbeingCheck:
    if not _is_enabled():
        return WellbeingCheck(
            signals_detected=[],
            overall_status="healthy",
            stress_score=0,
            intervention=None,
            message="Wellbeing support is currently disabled.",
            tips=[],
        )
    return await wellbeing_agent.check_wellbeing(current_user.id, period, db, mongodb.db)


@router.post("/pomodoro", response_model=PomodoroSessionResponse)
async def start_pomodoro(
    session: PomodoroSession,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PomodoroSessionResponse:
    if not _is_enabled():
        return PomodoroSessionResponse(
            status="disabled",
            focus_minutes=session.focus_minutes,
            break_minutes=session.break_minutes,
            topic=session.topic,
        )

    await _write_event(
        current_user.id,
        "break_started",
        {
            "page": "analytics",
            "action": "pomodoro_started",
        },
    )
    return PomodoroSessionResponse(
        status="started",
        focus_minutes=session.focus_minutes,
        break_minutes=session.break_minutes,
        topic=session.topic,
    )


@router.post("/event", response_model=WellbeingEventLogResponse)
async def log_wellbeing_event(
    event: WellbeingEventLog,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WellbeingEventLogResponse:
    if not _is_enabled():
        return WellbeingEventLogResponse(ok=False)

    await _write_event(current_user.id, event.event_type.value, event.context)
    return WellbeingEventLogResponse(ok=True)
