import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CLIENTS_URL = f"{BASE_URL}/api/clients"
INVOICES_URL = f"{BASE_URL}/api/invoices"
TIMEOUT = 30

ADMIN_EMAIL = "admin@brownledger.com"
ADMIN_PASSWORD = "demo123"

def test_invoices_api_create_and_list_invoices():
    # Authenticate and get token
    login_payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert "token" in login_data or "accessToken" in login_data or "access_token" in login_data, "No token found in login response"
    token = (
        login_data.get("token")
        or login_data.get("accessToken")
        or login_data.get("access_token")
    )
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Step 1: Create a client (required field for invoice clientId)
    client_payload = {"name": "Test Client for Invoice", "email": "invoice-client@example.com"}
    client_resp = requests.post(CLIENTS_URL, json=client_payload, headers=headers, timeout=TIMEOUT)
    assert client_resp.status_code == 201 or client_resp.status_code == 200, f"Failed to create client: {client_resp.text}"
    client_data = client_resp.json()
    assert "id" in client_data or "_id" in client_data or "clientId" in client_data, "Client ID missing in creation response"
    client_id = client_data.get("id") or client_data.get("_id") or client_data.get("clientId")

    # Step 2: Create an invoice with required fields: clientId and items
    invoice_payload = {
        "clientId": client_id,
        "items": [
            {"description": "Test item 1", "quantity": 2, "price": 100},
            {"description": "Test item 2", "quantity": 1, "price": 50}
        ]
    }
    invoice_resp = requests.post(INVOICES_URL, json=invoice_payload, headers=headers, timeout=TIMEOUT)
    assert invoice_resp.status_code == 201 or invoice_resp.status_code == 200, f"Failed to create invoice: {invoice_resp.text}"
    invoice_data = invoice_resp.json()
    assert "id" in invoice_data or "_id" in invoice_data or "invoiceId" in invoice_data, "Invoice ID missing in creation response"
    invoice_id = invoice_data.get("id") or invoice_data.get("_id") or invoice_data.get("invoiceId")

    try:
        # Step 3: List all invoices and validate the created invoice is present
        list_resp = requests.get(INVOICES_URL, headers=headers, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Failed to list invoices: {list_resp.text}"
        invoices_list = list_resp.json()
        assert isinstance(invoices_list, list), "Invoices list response is not an array"

        # Find created invoice in list by matching id
        found_invoice = None
        for inv in invoices_list:
            inv_id = inv.get("id") or inv.get("_id") or inv.get("invoiceId")
            if inv_id == invoice_id:
                found_invoice = inv
                break
        assert found_invoice is not None, "Created invoice not found in invoice list"

        # Validate required fields in found invoice
        assert found_invoice.get("clientId") == client_id, "Invoice clientId mismatch"
        assert isinstance(found_invoice.get("items"), list) and len(found_invoice["items"]) == 2, "Invoice items mismatch"

    finally:
        # Cleanup: delete the created invoice and client if possible
        # Try deleting invoice
        try:
            del_invoice_resp = requests.delete(f"{INVOICES_URL}/{invoice_id}", headers=headers, timeout=TIMEOUT)
            if del_invoice_resp.status_code not in (200, 204, 202):
                pass  # Could log failure but continue
        except Exception:
            pass

        # Try deleting client
        try:
            del_client_resp = requests.delete(f"{CLIENTS_URL}/{client_id}", headers=headers, timeout=TIMEOUT)
            if del_client_resp.status_code not in (200, 204, 202):
                pass
        except Exception:
            pass

test_invoices_api_create_and_list_invoices()