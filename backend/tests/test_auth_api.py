import pytest


class TestRegisterEndpoint:
    def test_register_success(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "newuser@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == "newuser@test.com"

    def test_register_duplicate_email(self, client):
        payload = {"email": "dup@test.com", "password": "P@ssw0rd!", "role": "user"}
        client.post("/api/v1/auth/register", json=payload)
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 400

    def test_register_missing_email(self, client):
        resp = client.post("/api/v1/auth/register", json={"password": "P@ss"})
        assert resp.status_code == 422  # Validation error


class TestLoginEndpoint:
    def test_login_success(self, client):
        # First register
        client.post("/api/v1/auth/register", json={
            "email": "login@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        resp = client.post("/api/v1/auth/login", data={
            "username": "login@test.com", "password": "P@ssw0rd!"
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "loginwrong@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        resp = client.post("/api/v1/auth/login", data={
            "username": "loginwrong@test.com", "password": "wrong"
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/v1/auth/login", data={
            "username": "ghost@test.com", "password": "nope"
        })
        assert resp.status_code == 401


class TestMeEndpoint:
    def test_me_with_valid_token(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "me@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        login_resp = client.post("/api/v1/auth/login", data={
            "username": "me@test.com", "password": "P@ssw0rd!"
        })
        token = login_resp.json()["access_token"]
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@test.com"

    def test_me_without_token(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code in [401, 403]

    def test_me_with_tampered_token(self, client):
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer fake.token.here"
        })
        assert resp.status_code == 403
