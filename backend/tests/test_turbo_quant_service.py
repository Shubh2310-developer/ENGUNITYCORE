from app.services.ai.turbo_quant_service import turbo_quant_service


def test_turbo_quant_validate_config_rejects_invalid_bit_width():
    error = turbo_quant_service.validate_config(
        {
            "enabled": True,
            "mode": "auto",
            "target": "auto",
            "variant": "prod",
            "bit_width": 9,
        }
    )
    assert error == "Invalid turbo_quant.bit_width"


def test_turbo_quant_provider_unsupported_fallback(monkeypatch):
    monkeypatch.setattr("app.services.ai.turbo_quant_service.settings.ENABLE_TURBO_QUANT_CHAT", True)

    metadata = turbo_quant_service.evaluate_request(
        "groq",
        {
            "enabled": True,
            "mode": "auto",
            "target": "auto",
            "variant": "prod",
            "bit_width": 4,
        },
    )

    assert metadata == {
        "requested": True,
        "applied": False,
        "provider": "groq",
        "fallback_reason": "provider_unsupported",
    }


def test_turbo_quant_supported_provider_applies(monkeypatch):
    monkeypatch.setattr("app.services.ai.turbo_quant_service.settings.ENABLE_TURBO_QUANT_CHAT", True)

    metadata = turbo_quant_service.evaluate_request(
        "ollama",
        {
            "enabled": True,
            "mode": "auto",
            "target": "auto",
            "variant": "prod",
            "bit_width": 4,
        },
    )

    assert metadata["requested"] is True
    assert metadata["applied"] is True
    assert metadata["provider"] == "ollama"
    assert metadata["compression_ratio"] == 4.0


def test_turbo_quant_feature_disabled_fallback(monkeypatch):
    monkeypatch.setattr("app.services.ai.turbo_quant_service.settings.ENABLE_TURBO_QUANT_CHAT", False)

    metadata = turbo_quant_service.evaluate_request(
        "ollama",
        {
            "enabled": True,
            "mode": "auto",
            "target": "auto",
            "variant": "prod",
            "bit_width": 4,
        },
    )

    assert metadata == {
        "requested": True,
        "applied": False,
        "provider": "ollama",
        "fallback_reason": "feature_disabled",
    }
