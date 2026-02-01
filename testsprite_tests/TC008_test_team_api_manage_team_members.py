import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
TEAM_URL = f"{BASE_URL}/api/team"

ADMIN_EMAIL = "admin@brownledger.com"
ADMIN_PASSWORD = "demo123"


def test_team_api_manage_team_members():
    session = requests.Session()
    timeout = 30

    # Authenticate and get token
    resp = session.post(
        LOGIN_URL,
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=timeout,
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json().get("token") or resp.json().get("accessToken")
    assert token, "No auth token received from login"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    invited_member_email = "newmember@example.com"
    invited_member_role = "member"
    updated_role = "admin"
    invited_member_id = None

    try:
        # GET /api/team - list team members
        get_resp = session.get(TEAM_URL, headers=headers, timeout=timeout)
        assert get_resp.status_code == 200, f"Failed to list team members: {get_resp.text}"
        members_list = get_resp.json()
        assert isinstance(members_list, list), "Team members response is not a list"

        # POST /api/team - invite new member
        invite_payload = {
            "email": invited_member_email,
            "role": invited_member_role,
        }
        post_resp = session.post(
            TEAM_URL, headers=headers, json=invite_payload, timeout=timeout
        )
        assert post_resp.status_code in [200, 201], f"Invite failed: {post_resp.text}"
        post_data = post_resp.json()
        invited_member_id = post_data.get("id") or post_data.get("userId") or post_data.get("memberId")
        assert invited_member_id, "No member ID returned after inviting user"
        assert post_data.get("email") == invited_member_email, "Invited email mismatch"
        assert post_data.get("role") == invited_member_role, "Invited role mismatch"

        # PATCH /api/team - update member role
        patch_payload = {
            "userId": invited_member_id,
            "role": updated_role,
        }
        patch_resp = session.patch(
            TEAM_URL, headers=headers, json=patch_payload, timeout=timeout
        )
        assert patch_resp.status_code == 200, f"Update role failed: {patch_resp.text}"
        patch_data = patch_resp.json()
        assert patch_data.get("id") == invited_member_id, "Updated member ID mismatch"
        assert patch_data.get("role") == updated_role, "Role not updated correctly"

        # Verify updated role via GET list
        get_resp2 = session.get(TEAM_URL, headers=headers, timeout=timeout)
        assert get_resp2.status_code == 200, f"Failed to list team members after update: {get_resp2.text}"
        members_after_update = get_resp2.json()
        updated_member = next(
            (m for m in members_after_update if m.get("id") == invited_member_id or m.get("userId") == invited_member_id),
            None,
        )
        assert updated_member, "Updated member not found in team list"
        assert updated_member.get("role") == updated_role, "Updated role mismatch in list"

    finally:
        # Cleanup: Delete the invited member if possible
        if invited_member_id:
            try:
                del_resp = session.delete(
                    f"{TEAM_URL}/{invited_member_id}", headers=headers, timeout=timeout
                )
                # Accept 200, 202, 204 as success deletes
                assert del_resp.status_code in [200, 202, 204], f"Failed to delete invited member: {del_resp.text}"
            except Exception:
                # If delete not supported or fails silently, just pass
                pass


test_team_api_manage_team_members()