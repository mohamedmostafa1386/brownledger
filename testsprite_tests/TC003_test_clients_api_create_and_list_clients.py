import requests

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@brownledger.com"
ADMIN_PASSWORD = "demo123"
TIMEOUT = 30

def test_clients_api_create_and_list_clients():
    session = requests.Session()
    try:
        # Authenticate to get token
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        assert token, "Token not found in login response"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Prepare client data with mandatory fields (name required, email optional)
        new_client = {
            "name": "Test Client Name",
            "email": "testclient@example.com"
        }
        # Create client
        create_resp = session.post(
            f"{BASE_URL}/api/clients",
            json=new_client,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201 or create_resp.status_code == 200, f"Client creation failed: {create_resp.text}"
        created_client = create_resp.json()
        assert "name" in created_client and created_client["name"] == new_client["name"]
        if "email" in new_client:
            assert "email" in created_client and created_client["email"] == new_client["email"]
        assert "id" in created_client, "Created client missing 'id' field"
        client_id = created_client["id"]

        # Retrieve client list
        list_resp = session.get(
            f"{BASE_URL}/api/clients",
            headers=headers,
            timeout=TIMEOUT
        )
        assert list_resp.status_code == 200, f"Fetching client list failed: {list_resp.text}"
        clients = list_resp.json()
        assert isinstance(clients, list), "Clients list response is not a list"

        # Verify the created client is in the list
        found = any(client.get("id") == client_id and client.get("name") == new_client["name"] for client in clients)
        assert found, "Created client not found in clients list"

    finally:
        # Cleanup: delete the created client if possible
        try:
            del_resp = session.delete(
                f"{BASE_URL}/api/clients/{client_id}",
                headers=headers,
                timeout=TIMEOUT
            )
            assert del_resp.status_code in (200, 204), f"Failed to delete client in cleanup: {del_resp.text}"
        except Exception:
            pass

test_clients_api_create_and_list_clients()