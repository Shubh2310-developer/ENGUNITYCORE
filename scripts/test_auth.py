import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_auth_flow():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "testpassword123"

    print(f"Testing with email: {email}")

    # 1. Register
    print("\n1. Registering user...")
    reg_response = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": email, "password": password}
    )
    if reg_response.status_code == 200:
        print("Registration successful!")
        print(reg_response.json())
    else:
        print(f"Registration failed: {reg_response.status_code}")
        print(reg_response.text)
        return

    # 2. Login
    print("\n2. Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": email, "password": password}
    )
    if login_response.status_code == 200:
        token_data = login_response.json()
        print("Login successful!")
        print(token_data)
        access_token = token_data["access_token"]
    else:
        print(f"Login failed: {login_response.status_code}")
        print(login_response.text)
        return

    # 3. Get Me (Protected)
    print("\n3. Fetching user info (protected route)...")
    me_response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if me_response.status_code == 200:
        print("Protected route access successful!")
        print(me_response.json())
    else:
        print(f"Protected route access failed: {me_response.status_code}")
        print(me_response.text)

if __name__ == "__main__":
    # Note: Backend server must be running
    try:
        test_auth_flow()
    except Exception as e:
        print(f"Error during test: {e}")
