import requests

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@brownledger.com"
ADMIN_PASSWORD = "demo123"
TIMEOUT = 30

def test_stock_api_adjust_stock_quantity():
    session = requests.Session()
    try:
        # Authenticate and get token
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        assert token, "No token received on login"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Prepare valid adjust stock data (using a dummy warehouseId and productId)
        # Since no resource IDs are provided, we first create a warehouse to get warehouseId
        # and then try to adjust stock with some productId and quantity.

        # Step 1: Create warehouse to use for stock adjustment
        warehouse_data = {
            "name": "Test Warehouse for Adjust Stock"
        }
        create_wh_resp = session.post(
            f"{BASE_URL}/api/stock/warehouses",
            json=warehouse_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_wh_resp.status_code in (200,201), f"Warehouse creation failed: {create_wh_resp.text}"
        warehouse = create_wh_resp.json()
        warehouse_id = warehouse.get("id")
        assert warehouse_id, "No warehouse ID returned on creation"

        # Step 2: Adjust stock with valid data
        valid_adjust_data = {
            "warehouseId": warehouse_id,
            "productId": "test-product-123",
            "quantity": 50,
            "reason": "Initial stock adjustment for testing"
        }
        adjust_resp = session.post(
            f"{BASE_URL}/api/stock/adjust",
            json=valid_adjust_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert adjust_resp.status_code == 200, f"Stock adjustment failed: {adjust_resp.text}"
        adjust_result = adjust_resp.json()
        assert adjust_result.get("warehouseId") == warehouse_id
        assert adjust_result.get("productId") == "test-product-123"
        assert adjust_result.get("quantity") == 50

        # Step 3: Adjust stock with invalid data - missing productId (required field)
        invalid_adjust_data = {
            "warehouseId": warehouse_id,
            "quantity": 10,
            "reason": "Invalid adjustment missing productId"
        }
        invalid_resp = session.post(
            f"{BASE_URL}/api/stock/adjust",
            json=invalid_adjust_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert invalid_resp.status_code >= 400, "Expected failure on invalid input (missing productId)"

        # Step 4: Adjust stock with invalid data - negative quantity (assuming validation)
        neg_qty_data = {
            "warehouseId": warehouse_id,
            "productId": "test-product-123",
            "quantity": -100,
            "reason": "Negative stock adjustment test"
        }
        neg_qty_resp = session.post(
            f"{BASE_URL}/api/stock/adjust",
            json=neg_qty_data,
            headers=headers,
            timeout=TIMEOUT
        )
        # The API might accept negative quantities if adjustment means decrement, so we just check for 2xx or 4xx
        # But the requirement says validate input properly, let's assume negative quantity is invalid for test
        assert neg_qty_resp.status_code >= 400, "Expected failure on invalid input (negative quantity)"

    finally:
        # Cleanup - delete the warehouse created
        if 'warehouse_id' in locals():
            session.delete(
                f"{BASE_URL}/api/stock/warehouses/{warehouse_id}",
                headers=headers,
                timeout=TIMEOUT
            )

test_stock_api_adjust_stock_quantity()