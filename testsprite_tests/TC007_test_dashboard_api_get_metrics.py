import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
DASHBOARD_URL = f"{BASE_URL}/api/dashboard"
AUTH_CREDENTIALS = {"email": "admin@brownledger.com", "password": "demo123"}
TIMEOUT = 30

def test_dashboard_api_get_metrics():
    session = requests.Session()
    try:
        # Authenticate and get token/cookies/session
        login_resp = session.post(LOGIN_URL, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        # Assuming token returned in JSON as token
        token = login_data.get("token")
        assert token, "Token not found in login response"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Use session with auth headers/cookies to get dashboard metrics
        dashboard_resp = session.get(DASHBOARD_URL, headers=headers, timeout=TIMEOUT)
        assert dashboard_resp.status_code == 200, f"Dashboard GET failed with status {dashboard_resp.status_code}"

        data = dashboard_resp.json()
        # Validate keys expected for real-time financial KPIs and metrics presence
        # Example checks of presence of some common KPIs (based on PRD descriptions)
        assert isinstance(data, dict), "Dashboard response is not a JSON object"
        required_keys = [
            "revenue", 
            "expenses", 
            "netProfit",
            "cashFlowForecast",
            "recentInvoices",
            "kpis"
        ]
        for key in required_keys:
            assert key in data, f"Missing key '{key}' in dashboard metrics response"

        # Validate types for some keys
        assert isinstance(data["revenue"], (int, float)), "Revenue should be a number"
        assert isinstance(data["expenses"], (int, float)), "Expenses should be a number"
        assert isinstance(data["netProfit"], (int, float)), "NetProfit should be a number"
        assert isinstance(data["cashFlowForecast"], dict), "CashFlowForecast should be an object"
        assert isinstance(data["recentInvoices"], list), "RecentInvoices should be a list"
        assert isinstance(data["kpis"], dict), "KPIs should be a dictionary"
    finally:
        session.close()

test_dashboard_api_get_metrics()