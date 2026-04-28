from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class WellbeingSignal(str, Enum):
    LATE_NIGHT = "late_night"
    FRUSTRATION = "frustration"
    MARATHON = "marathon"
    OVERWORK = "overwork"


class InterventionType(str, Enum):
    BREAK_REMINDER = "break_reminder"
    ENCOURAGEMENT = "encouragement"
    STUDY_TIP = "study_tip"
    FOCUS_SESSION = "focus_session"
    COOLDOWN = "cooldown"


class WellbeingIntervention(BaseModel):
    type: InterventionType
    message: str = Field(max_length=240)
    action: str = Field(max_length=80)
    duration: Optional[int] = Field(default=None, ge=1, le=60)
    tip: Optional[str] = Field(default=None, max_length=180)


class WellbeingCheck(BaseModel):
    signals_detected: List[WellbeingSignal]
    overall_status: str = Field(pattern="^(healthy|caution|concern)$")
    stress_score: float = Field(ge=0, le=10)
    intervention: Optional[WellbeingIntervention] = None
    message: str = Field(max_length=240)
    tips: List[str] = Field(default_factory=list, max_length=5)


class PomodoroSession(BaseModel):
    focus_minutes: int = Field(default=25, ge=5, le=90)
    break_minutes: int = Field(default=5, ge=1, le=30)
    rounds: int = Field(default=4, ge=1, le=8)
    topic: Optional[str] = Field(default=None, max_length=80)


class PomodoroSessionResponse(BaseModel):
    status: str
    focus_minutes: int
    break_minutes: int
    topic: Optional[str] = None


class WellbeingInteractionEvent(str, Enum):
    VIEWED = "viewed"
    DISMISSED = "dismissed"
    ACTION_CLICKED = "action_clicked"
    BREAK_STARTED = "break_started"
    POMODORO_COMPLETED = "pomodoro_completed"


class WellbeingEventLog(BaseModel):
    event_type: WellbeingInteractionEvent
    context: Dict[str, str | int | float | bool | None] = Field(default_factory=dict)

    @field_validator("context")
    @classmethod
    def validate_context(cls, value: Dict[str, str | int | float | bool | None]) -> Dict[str, str | int | float | bool | None]:
        if len(value) > 10:
            raise ValueError("context cannot have more than 10 keys")

        for key, item in value.items():
            if len(key) > 40:
                raise ValueError("context key length exceeds limit")
            if isinstance(item, str) and len(item) > 120:
                raise ValueError("context string value exceeds limit")

        return value


class WellbeingEventLogResponse(BaseModel):
    ok: bool
