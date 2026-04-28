from __future__ import annotations

from typing import Any, Dict, Optional

from app.core.config import settings

SUPPORTED_PROVIDERS = {"ollama"}
SUPPORTED_MODES = {"auto", "force", "off"}
SUPPORTED_TARGETS = {"kv_cache", "embeddings", "auto"}
SUPPORTED_VARIANTS = {"mse", "prod"}
SUPPORTED_BIT_WIDTHS = {2, 3, 4, 5, 6, 7, 8}


class TurboQuantService:
    """Evaluates Turbo Quant capability and runtime metadata truthfully."""

    def normalize_config(self, config: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not config:
            return None

        normalized = {
            "enabled": bool(config.get("enabled", False)),
            "mode": config.get("mode", "auto"),
            "target": config.get("target", "auto"),
            "variant": config.get("variant", "prod"),
            "bit_width": config.get("bit_width", 4),
        }

        return normalized

    def evaluate_request(
        self,
        provider: Optional[str],
        config: Optional[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        normalized = self.normalize_config(config)
        if not normalized:
            return None

        requested = bool(normalized.get("enabled", False)) and normalized.get("mode") != "off"
        if not requested:
            return {
                "requested": False,
                "applied": False,
                "provider": provider,
            }

        if not settings.ENABLE_TURBO_QUANT_CHAT:
            return {
                "requested": True,
                "applied": False,
                "provider": provider,
                "fallback_reason": "feature_disabled",
            }

        runtime_provider = (provider or "unknown").lower()
        if runtime_provider not in SUPPORTED_PROVIDERS:
            return {
                "requested": True,
                "applied": False,
                "provider": runtime_provider,
                "fallback_reason": "provider_unsupported",
            }

        metadata: Dict[str, Any] = {
            "requested": True,
            "applied": True,
            "provider": runtime_provider,
            "variant": normalized.get("variant"),
            "bit_width": normalized.get("bit_width"),
        }

        if runtime_provider == "ollama":
            bit_width = int(normalized.get("bit_width", 4))
            metadata["compression_ratio"] = round(16.0 / bit_width, 2)

        return metadata

    def provider_from_strategy(self, strategy: Optional[str]) -> str:
        if strategy == "recursive_intensive":
            return "groq"
        return "ollama"

    def validate_config(self, config: Optional[Dict[str, Any]]) -> Optional[str]:
        normalized = self.normalize_config(config)
        if not normalized:
            return None

        mode = normalized.get("mode")
        target = normalized.get("target")
        variant = normalized.get("variant")
        bit_width = normalized.get("bit_width")

        if mode not in SUPPORTED_MODES:
            return "Invalid turbo_quant.mode"
        if target not in SUPPORTED_TARGETS:
            return "Invalid turbo_quant.target"
        if variant not in SUPPORTED_VARIANTS:
            return "Invalid turbo_quant.variant"
        if bit_width not in SUPPORTED_BIT_WIDTHS:
            return "Invalid turbo_quant.bit_width"

        return None


turbo_quant_service = TurboQuantService()
