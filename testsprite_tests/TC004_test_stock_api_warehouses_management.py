import requests

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@brownledger.com"
ADMIN_PASSWORD = "demo123"
TIMEOUT = 30

def test_stock_api_warehouses_management():
    session = requests.Session()
    try:
        # Login to get auth token
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        # Assume token is returned as "token" or similar in response
        token = login_data.get("token")
        assert token, "Authentication token not found in login response"
        headers = {"Authorization": f"Bearer {token}"}

        # GET /api/stock/warehouses - list warehouses
        get_resp = session.get(f"{BASE_URL}/api/stock/warehouses", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Failed to list warehouses: {get_resp.text}"
        warehouses_list = get_resp.json()
        assert isinstance(warehouses_list, list), "Warehouses GET response is not a list"

        # POST /api/stock/warehouses - create a new warehouse
        # Since no schema is provided for warehouse creation, create a valid minimal payload
        new_warehouse_payload = {
            "name": "Test Warehouse for TC004",
            "location": "Test Location"
        }
        post_resp = session.post(
            f"{BASE_URL}/api/stock/warehouses",
            headers={**headers, "Content-Type": "application/json"},
            json=new_warehouse_payload,
            timeout=TIMEOUT
        )
        assert post_resp.status_code in (200, 201), f"Failed to create warehouse: {post_resp.text}"
        created_warehouse = post_resp.json()
        # Verify created warehouse structure - at least id and name should exist
        warehouse_id = created_warehouse.get("id") or created_warehouse.get("_id")
        assert warehouse_id, "Created warehouse ID not found"
        assert created_warehouse.get("name") == new_warehouse_payload["name"], "Created warehouse name mismatch"

    finally:
        # Cleanup: delete the warehouse created
        if 'warehouse_id' in locals() and warehouse_id:
            try:
                del_resp = session.delete(f"{BASE_URL}/api/stock/warehouses/{warehouse_id}", headers=headers, timeout=TIMEOUT)
                # Allow 200, 204 as success, also 404 if already deleted
                assert del_resp.status_code in (200, 204, 404), f"Failed to delete warehouse: {del_resp.text}"
            except Exception:
                pass

test_stock_api_warehouses_management()
