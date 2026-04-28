from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.analytics import AnalyticsSession
from app.schemas.wellbeing_agent import (
    InterventionType,
    WellbeingCheck,
    WellbeingIntervention,
    WellbeingSignal,
)


class WellbeingAgent:
    PERIOD_HOURS = {"24h": 24, "7d": 168, "30d": 720}
    CACHE_TTL_SECONDS = 180
    MAX_SESSION_SCAN = 200
    MAX_EVENT_SCAN = 200
    INTERVENTION_COOLDOWN = timedelta(hours=2)

    def __init__(self) -> None:
        self._cache: Dict[Tuple[int, str], Tuple[datetime, WellbeingCheck]] = {}
        self._last_intervention_at: Dict[int, datetime] = {}

    async def check_wellbeing(
        self,
        user_id: int,
        period: str,
        db: Session,
        mongo_db: Optional[Any] = None,
    ) -> WellbeingCheck:
        if period not in self.PERIOD_HOURS:
            period = "24h"

        cache_key = (user_id, period)
        cached = self._cache.get(cache_key)
        now = datetime.utcnow()
        self._prune_cache(now)
        if cached and (now - cached[0]).total_seconds() < self.CACHE_TTL_SECONDS:
            return cached[1]

        since = now - timedelta(hours=self.PERIOD_HOURS[period])
        sessions = self._load_sessions(db, user_id, since)
        events = await self._load_mongo_events(mongo_db, user_id, since)

        signals = self._detect_signals(sessions, events, since)
        stress_score = self._calculate_stress(signals)
        status = "healthy" if stress_score < 3 else "caution" if stress_score < 6 else "concern"
        intervention = self._build_intervention(user_id, signals, status, now)

        result = WellbeingCheck(
            signals_detected=signals,
            overall_status=status,
            stress_score=stress_score,
            intervention=intervention,
            message=self._message_for(status),
            tips=self._tips_for(signals),
        )
        self._cache[cache_key] = (now, result)
        return result

    def _prune_cache(self, now: datetime) -> None:
        expired_keys = [
            key for key, (created_at, _) in self._cache.items()
            if (now - created_at).total_seconds() >= self.CACHE_TTL_SECONDS
        ]
        for key in expired_keys:
            self._cache.pop(key, None)

    def _load_sessions(self, db: Session, user_id: int, since: datetime) -> List[AnalyticsSession]:
        return (
            db.query(AnalyticsSession)
            .filter(
                AnalyticsSession.user_id == user_id,
                AnalyticsSession.updated_at >= since,
            )
            .order_by(desc(AnalyticsSession.updated_at))
            .limit(self.MAX_SESSION_SCAN)
            .all()
        )

    async def _load_mongo_events(
        self,
        mongo_db: Optional[Any],
        user_id: int,
        since: datetime,
    ) -> List[Dict[str, Any]]:
        if mongo_db is None:
            return []

        try:
            cursor = (
                mongo_db.ai_logs.find(
                    {
                        "$or": [{"user_id": user_id}, {"user_id": str(user_id)}],
                        "created_at": {"$gte": since},
                    },
                    {
                        "created_at": 1,
                        "status": 1,
                        "event_type": 1,
                        "error": 1,
                        "metadata.retry_count": 1,
                    },
                )
                .sort("created_at", -1)
                .limit(self.MAX_EVENT_SCAN)
            )
            return await cursor.to_list(length=self.MAX_EVENT_SCAN)
        except Exception:
            return []

    def _detect_signals(
        self,
        sessions: Iterable[AnalyticsSession],
        events: Iterable[Dict[str, Any]],
        since: datetime,
    ) -> List[WellbeingSignal]:
        signals: List[WellbeingSignal] = []
        session_list = list(sessions)
        event_list = list(events)

        timestamps = [session.updated_at for session in session_list if session.updated_at]
        timestamps.extend(event.get("created_at") for event in event_list if event.get("created_at"))
        late_night_count = sum(1 for stamp in timestamps if stamp.hour >= 23 or stamp.hour < 5)
        if late_night_count >= 3:
            signals.append(WellbeingSignal.LATE_NIGHT)

        failed_events = [event for event in event_list if self._is_failed_or_retry_event(event)]
        if len(event_list) >= 5 and len(failed_events) / len(event_list) >= 0.35:
            signals.append(WellbeingSignal.FRUSTRATION)

        durations = [self._session_duration_hours(session) for session in session_list]
        if any(duration >= 4 for duration in durations):
            signals.append(WellbeingSignal.MARATHON)

        active_hours = sum(min(duration, 8) for duration in durations)
        if active_hours >= 10 and (datetime.utcnow() - since).total_seconds() <= 24 * 60 * 60 + 1:
            signals.append(WellbeingSignal.OVERWORK)

        return signals

    def _is_failed_or_retry_event(self, event: Dict[str, Any]) -> bool:
        event_type = str(event.get("event_type") or "").lower()
        status = str(event.get("status") or "").lower()
        metadata = event.get("metadata") if isinstance(event.get("metadata"), dict) else {}
        retry_count = metadata.get("retry_count", 0)
        return bool(event.get("error")) or status in {"error", "failed"} or "retry" in event_type or retry_count > 0

    def _session_duration_hours(self, session: AnalyticsSession) -> float:
        if not session.created_at or not session.updated_at:
            return 0
        return max((session.updated_at - session.created_at).total_seconds() / 3600, 0)

    def _calculate_stress(self, signals: Iterable[WellbeingSignal]) -> float:
        weights = {
            WellbeingSignal.LATE_NIGHT: 2.0,
            WellbeingSignal.FRUSTRATION: 3.0,
            WellbeingSignal.MARATHON: 3.0,
            WellbeingSignal.OVERWORK: 4.0,
        }
        return min(10.0, sum(weights.get(signal, 1.0) for signal in signals))

    def _build_intervention(
        self,
        user_id: int,
        signals: List[WellbeingSignal],
        status: str,
        now: datetime,
    ) -> Optional[WellbeingIntervention]:
        if status == "healthy":
            return None

        last_intervention = self._last_intervention_at.get(user_id)
        if status != "concern" and last_intervention and now - last_intervention < self.INTERVENTION_COOLDOWN:
            return None

        self._last_intervention_at[user_id] = now
        if WellbeingSignal.OVERWORK in signals or WellbeingSignal.MARATHON in signals:
            return WellbeingIntervention(
                type=InterventionType.BREAK_REMINDER,
                message="You have been in deep focus for a while. A short reset can protect your next pass.",
                action="start_break_timer",
                duration=10,
                tip="Try a 10-minute walk or stretch before continuing.",
            )
        if WellbeingSignal.FRUSTRATION in signals:
            return WellbeingIntervention(
                type=InterventionType.COOLDOWN,
                message="Repeated retries can drain focus. Pause briefly, then return with one smaller next step.",
                action="open_support_tips",
                duration=5,
                tip="Write the current blocker in one sentence before retrying.",
            )
        return WellbeingIntervention(
            type=InterventionType.ENCOURAGEMENT,
            message="You are putting in steady effort. Keep the pace sustainable.",
            action="open_support_tips",
            tip="A consistent routine beats a late push.",
        )

    def _message_for(self, status: str) -> str:
        if status == "healthy":
            return "Your analytics work rhythm looks balanced right now."
        if status == "caution":
            return "Your recent activity suggests a quick reset may help maintain focus."
        return "Your recent workload looks intense. Consider a short pause before continuing."

    def _tips_for(self, signals: Iterable[WellbeingSignal]) -> List[str]:
        tips_by_signal = {
            WellbeingSignal.LATE_NIGHT: [
                "Set a stopping point before late-night analysis work.",
                "Save the session and resume after rest for cleaner decisions.",
            ],
            WellbeingSignal.FRUSTRATION: [
                "If errors repeat, change one variable at a time.",
                "Step away for five minutes before another debugging pass.",
            ],
            WellbeingSignal.MARATHON: [
                "Use a 25/5 focus rhythm for sustained analytics work.",
                "Stand up and look away from the screen between chart iterations.",
            ],
            WellbeingSignal.OVERWORK: [
                "Protect tomorrow's focus by closing one clear task now.",
                "Quality review is easier after a real break.",
            ],
        }
        tips: List[str] = []
        for signal in signals:
            tips.extend(tips_by_signal.get(signal, []))
        return tips[:5] or ["Keep breaks intentional and save your analytics session before stepping away."]


wellbeing_agent = WellbeingAgent()
