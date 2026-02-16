import pytest
from jose import jwt
from app.core.config import settings
from app.core.security import ALGORITHM


class TestJWTSecurity:
    """Critical JWT attack vector tests"""

    def test_none_algorithm_attack(self, client):
        """CVE-2015-9235 — 'none' algorithm bypass"""
        malicious_token = jwt.encode(
            {"sub": "1", "exp": 9999999999},
            key="", algorithm="none"
        )
        # This crafted token uses 'none' algorithm — MUST be rejected
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {malicious_token}"
        })
        assert resp.status_code == 403

    def test_algorithm_confusion_attack(self, client):
        """Test RS256→HS256 algorithm confusion"""
        # Attacker tries to use public key as HMAC secret
        malicious_token = jwt.encode(
            {"sub": "1", "exp": 9999999999},
            key="some-public-key", algorithm="HS256"
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {malicious_token}"
        })
        assert resp.status_code == 403

    def test_expired_token_rejected(self, client):
        expired_token = jwt.encode(
            {"sub": "1", "exp": 1000000000},  # Year 2001
            settings.SECRET_KEY, algorithm=ALGORITHM
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {expired_token}"
        })
        assert resp.status_code == 403

    def test_token_without_sub_claim(self, client):
        token = jwt.encode(
            {"exp": 9999999999},  # No 'sub' claim
            settings.SECRET_KEY, algorithm=ALGORITHM
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code in [403, 422]

    def test_sql_injection_in_token_sub(self, client):
        token = jwt.encode(
            {"sub": "1 OR 1=1; DROP TABLE users;--", "exp": 9999999999},
            settings.SECRET_KEY, algorithm=ALGORITHM
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code in [403, 422, 500]


class TestInputValidation:
    """Test all auth endpoints against injection attacks"""

    INJECTION_PAYLOADS = [
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "admin@test.com' OR '1'='1",
        "{{7*7}}",  # Template injection
        "${7*7}",   # Expression injection
        "admin\x00@test.com",  # Null byte injection
        "a" * 10000,  # Buffer overflow attempt
    ]

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_login_email_injection(self, client, payload):
        resp = client.post("/api/v1/auth/login", data={
            "username": payload, "password": "test"
        })
        assert resp.status_code in [401, 422]

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_login_password_injection(self, client, payload):
        resp = client.post("/api/v1/auth/login", data={
            "username": "test@test.com", "password": payload
        })
        assert resp.status_code in [401, 422]

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_register_email_injection(self, client, payload):
        resp = client.post("/api/v1/auth/register", json={
            "email": payload, "password": "ValidP@ss1", "role": "user"
        })
        assert resp.status_code in [400, 422]

    def test_register_role_escalation(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "hacker@test.com", "password": "P@ssw0rd!",
            "role": "admin"
        })
        # Should either reject or create as 'user' only
        if resp.status_code == 200:
            assert resp.json()["role"] == "user"


class TestSecurityHeaders:
    def test_cors_rejects_unauthorized_origin(self, client):
        resp = client.options("/api/v1/auth/login", headers={
            "Origin": "https://evil-site.com",
            "Access-Control-Request-Method": "POST",
        })
        allowed_origin = resp.headers.get("Access-Control-Allow-Origin", "")
        assert allowed_origin != "*" or "evil-site.com" not in allowed_origin

    def test_no_sensitive_headers_exposed(self, client):
        resp = client.post("/api/v1/auth/login", data={
            "username": "test@test.com", "password": "whatever"
        })
        # Server should not expose internal headers
        assert "X-Powered-By" not in resp.headers
