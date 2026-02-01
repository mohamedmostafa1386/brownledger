import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

def test_auth_api_login_functionality():
    valid_credentials = {
        "email": "admin@brownledger.com",
        "password": "demo123"
    }
    invalid_password = {
        "email": "admin@brownledger.com",
        "password": "WrongPassword"
    }
    invalid_email = {
        "email": "nonexistentuser@example.com",
        "password": "SomePassword123"
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Test valid login
    try:
        response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=valid_credentials,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        json_resp = response.json()
        assert "token" in json_resp or "accessToken" in json_resp or "auth" in json_resp, "Expected auth token in response"
    except requests.RequestException as e:
        assert False, f"Request failed during valid login test: {e}"

    # Test invalid password login
    try:
        response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=invalid_password,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 401 or response.status_code == 400, f"Expected 401/400 for invalid password but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during invalid password test: {e}"

    # Test invalid email login
    try:
        response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=invalid_email,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 401 or response.status_code == 400, f"Expected 401/400 for invalid email but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed during invalid email test: {e}"

test_auth_api_login_functionality()