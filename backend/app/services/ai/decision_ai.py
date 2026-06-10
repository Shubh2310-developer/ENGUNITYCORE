from typing import List, Dict, Any
import json
import logging
import hashlib
import os
from app.services.ai.groq_client import groq_client
from app.schemas.decision import DecisionBase, AIFlagSchema

logger = logging.getLogger(__name__)

# Establish defensive Redis cache integration
try:
    import redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Decision Vault AI cache connected to Redis at %s", REDIS_URL)
except Exception as exc:
    logger.info("Redis not available for Decision Vault AI cache, using in-memory fallback: %s", exc)
    redis_client = None

# Internal fallback dict for dev / test environments without Redis
_local_memory_cache: Dict[str, List[Dict[str, Any]]] = {}


class DecisionAnalysisError(Exception):
    def __init__(self, code: str, message: str, retryable: bool = True):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable

class DecisionAIService:
    """
    Service for adversarial AI review of decisions.
    Challenges assumptions, detects biases, and identifies missing options.
    """

    def __init__(self):
        self.system_prompt = (
            "You are the Engunity Adversarial AI Reviewer. Your goal is NOT to be helpful, "
            "but to be skeptical and challenge the user's reasoning in their Decision Vault.\n\n"
            "You must analyze the decision metadata and provide a list of 'flags'.\n"
            "Each flag should have:\n"
            "- id: unique string (e.g., 'flag_001', 'flag_002')\n"
            "- flag_type: must be one of:\n"
            "  * 'missing_option' - Only considering limited alternatives\n"
            "  * 'weak_evidence' - Insufficient or poor quality evidence\n"
            "  * 'bias_detected' - General cognitive bias detected\n"
            "  * 'contradiction' - Logical inconsistencies in reasoning\n"
            "  * 'sunk_cost_fallacy' - Letting past investment influence decision\n"
            "  * 'anchoring_bias' - Over-reliance on first piece of information\n"
            "  * 'availability_bias' - Overweighting recent/memorable information\n"
            "  * 'groupthink' - Conformity pressure suppressing alternatives\n"
            "  * 'optimism_bias' - Unrealistic positive expectations\n"
            "  * 'status_quo_bias' - Preference for current state without justification\n"
            "  * 'recency_bias' - Overweighting recent events\n"
            "  * 'bandwagon_effect' - Following others without independent evaluation\n"
            "- severity: 'info', 'warning', or 'critical'\n"
            "- message: concise description of the issue (2-3 sentences max)\n"
            "- suggested_action: specific actionable advice\n"
            "- dismissed: false\n\n"
            "DETECTION GUIDELINES:\n"
            "1. MISSING_OPTION: Flag if <3 options, or missing obvious alternatives like 'do nothing', 'hybrid approach'\n"
            "2. WEAK_EVIDENCE: Flag if high confidence with <2 primary sources, or only anecdotal evidence\n"
            "3. SUNK_COST_FALLACY: Keywords: 'already invested', 'spent time/money', 'can't waste', 'too far to turn back'\n"
            "4. ANCHORING_BIAS: First option dominates thinking, or external benchmark heavily influences\n"
            "5. OPTIMISM_BIAS: All tradeoffs rated high (>4), or no cons listed, or risks underestimated\n"
            "6. STATUS_QUO_BIAS: 'Current approach' option has no real justification except 'it works now'\n"
            "7. AVAILABILITY_BIAS: Recent events/examples dominate reasoning, lack of historical perspective\n"
            "8. GROUPTHINK: Language like 'everyone thinks', 'team consensus', without dissenting views\n"
            "9. RECENCY_BIAS: Over-focus on latest information, ignoring longer-term patterns\n"
            "10. BANDWAGON_EFFECT: 'Industry standard', 'everyone is doing it' without independent analysis\n"
            "11. CONTRADICTION: Claims that contradict each other in context, options, or evidence\n\n"
            "Be critical but constructive. Return ONLY a valid JSON array of flag objects."
        )

    async def analyze_decision(self, decision: DecisionBase) -> List[Dict[str, Any]]:
        """
        Analyze a decision and return AI flags. Includes cache checks.
        """
        decision_data = decision.model_dump()
        
        # 1. Deterministic cache key based on decision contents
        payload_bytes = json.dumps(decision_data, sort_keys=True, default=str).encode('utf-8')
        cache_key = f"decision_ai_cache:{hashlib.sha256(payload_bytes).hexdigest()}"

        # 2. Redis cache check
        if redis_client is not None:
            try:
                cached_res = redis_client.get(cache_key)
                if cached_res:
                    logger.info("⚡ AI Critique Cache HIT (Redis): %s", cache_key)
                    return json.loads(cached_res)
            except Exception as exc:
                logger.warning("Redis cache read failed: %s", exc)

        # 3. Local memory fallback check
        if cache_key in _local_memory_cache:
            logger.info("⚡ AI Critique Cache HIT (Memory): %s", cache_key)
            return _local_memory_cache[cache_key]

        # 4. Cache Miss - Live Call
        logger.info("🌀 Cache MISS. Fetching AI analysis from model service...")
        prompt = f"Analyze the following decision and provide adversarial flags in JSON format:\n\n{json.dumps(decision_data, indent=2, default=str)}"
        
        try:
            response = await groq_client.get_completion([
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ])
        except Exception as exc:
            logger.exception("Decision AI provider call failed")
            raise DecisionAnalysisError("AI_PROVIDER_ERROR", f"Decision analysis service failed: {exc}", retryable=True) from exc

        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        if start_idx == -1 or end_idx <= 0:
            logger.warning("Decision AI response missing JSON array")
            raise DecisionAnalysisError("AI_RESPONSE_INVALID_JSON", "Decision analysis returned a non-JSON response", retryable=True)

        flags_json = response[start_idx:end_idx]
        try:
            parsed = json.loads(flags_json)
        except (ValueError, json.JSONDecodeError) as exc:
            logger.warning("Decision AI JSON parse failed")
            raise DecisionAnalysisError("AI_RESPONSE_INVALID_JSON", "Decision analysis returned invalid JSON", retryable=True) from exc

        if not isinstance(parsed, list):
            raise DecisionAnalysisError("AI_RESPONSE_SCHEMA_INVALID", "Decision analysis response must be a list of flags", retryable=False)

        validated: List[Dict[str, Any]] = []
        for item in parsed:
            try:
                flag = AIFlagSchema.model_validate(item)
                validated.append(flag.model_dump())
            except Exception as exc:
                logger.warning("Decision AI schema validation failed for flag: %s", item)
                raise DecisionAnalysisError("AI_RESPONSE_SCHEMA_INVALID", f"Decision analysis returned malformed flag: {exc}", retryable=False) from exc

        # 5. Populate caches for future requests
        _local_memory_cache[cache_key] = validated
        if redis_client is not None:
            try:
                # Set TTL of 24 hours (86400 seconds)
                redis_client.setex(cache_key, 86400, json.dumps(validated))
                logger.info("💾 Cached AI analysis in Redis: %s", cache_key)
            except Exception as exc:
                logger.warning("Redis cache write failed: %s", exc)

        return validated

decision_ai_service = DecisionAIService()

