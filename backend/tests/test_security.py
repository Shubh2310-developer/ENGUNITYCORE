import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import (
    create_access_token, verify_password, get_password_hash, ALGORITHM
)
from app.core.config import settings


class TestPasswordHashing:
    def test_hash_and_verify_correct_password(self):
        hashed = get_password_hash("MySecurePass123!")
        assert verify_password("MySecurePass123!", hashed) is True

    def test_reject_wrong_password(self):
        hashed = get_password_hash("CorrectPassword")
        assert verify_password("WrongPassword", hashed) is False

    def test_truncate_at_72_bytes(self):
        """bcrypt silently truncates at 72 bytes — ensure consistency"""
        long_pass = "A" * 100
        hashed = get_password_hash(long_pass)
        assert verify_password(long_pass, hashed) is True
        # First 72 chars should also match (truncation behavior)
        assert verify_password("A" * 72, hashed) is True

    def test_empty_password_rejection(self):
        hashed = get_password_hash("notempty")
        assert verify_password("", hashed) is False

    def test_unicode_password(self):
        hashed = get_password_hash("пароль123!密码")
        assert verify_password("пароль123!密码", hashed) is True


class TestJWTTokens:
    def test_create_token_with_custom_expiry(self):
        token = create_access_token("42", expires_delta=timedelta(minutes=15))
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "42"

    def test_create_token_default_expiry(self):
        token = create_access_token("42")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_token_tamper_detection(self):
        token = create_access_token("42")
        # Tamper with the token
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(Exception):
            jwt.decode(tampered, settings.SECRET_KEY, algorithms=[ALGORITHM])

    def test_expired_token_rejected(self):
        token = create_access_token("42", expires_delta=timedelta(seconds=-1))
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

    def test_wrong_secret_rejected(self):
        token = create_access_token("42")
        with pytest.raises(jwt.JWTError):
            jwt.decode(token, "wrong-secret-key", algorithms=[ALGORITHM])
