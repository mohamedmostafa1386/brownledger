import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
WAREHOUSES_URL = f"{BASE_URL}/api/stock/warehouses"
TRANSFER_URL = f"{BASE_URL}/api/stock/transfer"
ADJUST_URL = f"{BASE_URL}/api/stock/adjust"

ADMIN_EMAIL = "admin@brownledger.com"
ADMIN_PASSWORD = "demo123"
TIMEOUT = 30


def test_stock_api_transfer_stock_between_warehouses():
    # Authenticate and get token
    login_resp = requests.post(
        LOGIN_URL,
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/json"},
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json().get("token")
    assert token, "Auth token missing in login response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Helper to create warehouse
    def create_warehouse(name):
        resp = requests.post(
            WAREHOUSES_URL, json={"name": name}, headers=headers, timeout=TIMEOUT
        )
        assert resp.status_code == 201, f"Failed to create warehouse: {resp.text}"
        data = resp.json()
        assert "id" in data, "Warehouse creation response missing id"
        return data["id"]

    # Helper to delete warehouse
    def delete_warehouse(warehouse_id):
        # No explicit DELETE endpoint mentioned,
        # so skipping actual deletion API call
        # Assuming no delete API exists or it's handled elsewhere
        pass

    # Helper to adjust stock quantity for a warehouse and item SKU
    def adjust_stock(warehouse_id, sku, quantity):
        adjust_payload = {
            "warehouseId": warehouse_id,
            "sku": sku,
            "quantity": quantity,
        }
        resp = requests.post(
            ADJUST_URL, json=adjust_payload, headers=headers, timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"Failed to adjust stock: {resp.text}"

    # Create two warehouses to transfer stock between
    wh1_id = None
    wh2_id = None
    sku_test = "TESTSKU001"
    try:
        wh1_id = create_warehouse("Test Warehouse 1")
        wh2_id = create_warehouse("Test Warehouse 2")

        # Initialize stock quantity in warehouse 1 for the SKU
        adjust_stock(wh1_id, sku_test, 100)
        adjust_stock(wh2_id, sku_test, 0)

        # 1. Valid transfer - transfer 50 units from wh1 to wh2
        transfer_payload_valid = {
            "fromWarehouseId": wh1_id,
            "toWarehouseId": wh2_id,
            "sku": sku_test,
            "quantity": 50,
        }
        transfer_resp = requests.post(
            TRANSFER_URL, json=transfer_payload_valid, headers=headers, timeout=TIMEOUT
        )
        assert transfer_resp.status_code == 200, f"Valid transfer failed: {transfer_resp.text}"
        transfer_data = transfer_resp.json()
        assert (
            transfer_data.get("transferredQuantity") == 50
        ), "Transferred quantity mismatch in valid transfer response"

        # 2. Invalid transfer - transfer quantity exceeds source warehouse stock
        transfer_payload_invalid_qty = {
            "fromWarehouseId": wh1_id,
            "toWarehouseId": wh2_id,
            "sku": sku_test,
            "quantity": 1000,
        }
        transfer_resp2 = requests.post(
            TRANSFER_URL, json=transfer_payload_invalid_qty, headers=headers, timeout=TIMEOUT
        )
        assert (
            transfer_resp2.status_code == 400
            or transfer_resp2.status_code == 422
        ), f"Expected failure on excessive quantity transfer, got: {transfer_resp2.status_code}"
        error_data = transfer_resp2.json()
        assert (
            "error" in error_data or "message" in error_data
        ), "Error response missing 'error' or 'message' for invalid quantity transfer"

        # 3. Invalid transfer - invalid warehouse IDs
        transfer_payload_invalid_wh = {
            "fromWarehouseId": "invalid_from_id",
            "toWarehouseId": "invalid_to_id",
            "sku": sku_test,
            "quantity": 10,
        }
        transfer_resp3 = requests.post(
            TRANSFER_URL, json=transfer_payload_invalid_wh, headers=headers, timeout=TIMEOUT
        )
        assert (
            transfer_resp3.status_code == 400
            or transfer_resp3.status_code == 404
            or transfer_resp3.status_code == 422
        ), f"Expected failure on invalid warehouse IDs, got: {transfer_resp3.status_code}"
        error_data3 = transfer_resp3.json()
        assert (
            "error" in error_data3 or "message" in error_data3
        ), "Error response missing 'error' or 'message' for invalid warehouse IDs"

    finally:
        if wh1_id:
            delete_warehouse(wh1_id)
        if wh2_id:
            delete_warehouse(wh2_id)


test_stock_api_transfer_stock_between_warehouses()
