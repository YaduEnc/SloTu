from sqlalchemy import select

from app.core.security import verify_secret
from app.models.seller_profile import SellerProfile
from app.models.user import User
from app.services import auth_service, user_service


def login_user(client, monkeypatch, *, phone: str, otp: str = "123456") -> dict:
    async def fake_send(phone_number: str, code: str) -> str:
        return "provider-request-id"

    monkeypatch.setattr(auth_service, "generate_otp", lambda: otp)
    monkeypatch.setattr(auth_service, "send_otp", fake_send)

    send_response = client.post("/api/auth/otp/send", json={"phone": phone})
    assert send_response.status_code == 200

    verify_response = client.post(
        "/api/auth/otp/verify",
        json={
            "request_id": send_response.json()["request_id"],
            "phone": phone,
            "otp": otp,
        },
    )
    assert verify_response.status_code == 200
    return verify_response.json()


def test_patch_me_updates_name_and_email(client, monkeypatch):
    login = login_user(client, monkeypatch, phone="9876543210")

    response = client.patch(
        "/api/users/me",
        json={"name": "Aman Kumar", "email": "aman@example.com"},
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Aman Kumar"
    assert response.json()["email"] == "aman@example.com"


def test_patch_me_rejects_duplicate_email(client, monkeypatch):
    first_login = login_user(client, monkeypatch, phone="9876543210")
    response = client.patch(
        "/api/users/me",
        json={"email": "shared@example.com"},
        headers={"Authorization": f"Bearer {first_login['access_token']}"},
    )
    assert response.status_code == 200

    second_login = login_user(client, monkeypatch, phone="9123456789")
    duplicate_response = client.patch(
        "/api/users/me",
        json={"email": "shared@example.com"},
        headers={"Authorization": f"Bearer {second_login['access_token']}"},
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["error"]["code"] == "EMAIL_TAKEN"


def test_become_seller_creates_profile_and_updates_auth_me(client, monkeypatch):
    login = login_user(client, monkeypatch, phone="9876543210")

    become_response = client.post(
        "/api/users/become-seller",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )

    assert become_response.status_code == 201
    body = become_response.json()
    assert body["seller_profile"]["kyc_status"] == "pending"
    assert body["seller_profile"]["upi_verified"] is False

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["role"] == "seller"
    assert me_response.json()["seller_profile"]["user_id"] == body["seller_profile"]["user_id"]


def test_seller_upi_endpoint_saves_format_valid_upi_and_marks_kyc_submitted(client, monkeypatch):
    login = login_user(client, monkeypatch, phone="9876543210")
    client.post("/api/users/become-seller", headers={"Authorization": f"Bearer {login['access_token']}"})

    response = client.post(
        "/api/users/seller/upi",
        json={"upi_id": "aman@okhdfcbank"},
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "upi_id": "aman@okhdfcbank",
        "upi_verified": False,
        "verification_status": "FORMAT_VALID",
    }


def test_seller_upi_rejects_invalid_format(client, monkeypatch):
    login = login_user(client, monkeypatch, phone="9876543210")
    client.post("/api/users/become-seller", headers={"Authorization": f"Bearer {login['access_token']}"})

    response = client.post(
        "/api/users/seller/upi",
        json={"upi_id": "not-a-vpa"},
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_UPI_ID"


def test_aadhaar_send_and_verify_marks_kyc_approved(client, monkeypatch, session_factory):
    login = login_user(client, monkeypatch, phone="9876543210")
    client.post("/api/users/become-seller", headers={"Authorization": f"Bearer {login['access_token']}"})

    monkeypatch.setattr(user_service, "generate_otp", lambda: "654321")

    send_response = client.post(
        "/api/users/seller/aadhaar/send-otp",
        json={"aadhaar": "123456781234"},
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert send_response.status_code == 200

    verify_response = client.post(
        "/api/users/seller/aadhaar/verify-otp",
        json={"kyc_request_id": send_response.json()["kyc_request_id"], "otp": "654321"},
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["aadhaar_verified"] is True
    assert verify_response.json()["kyc_status"] == "approved"

    with session_factory() as session:
        user = session.scalar(select(User).where(User.phone == "+919876543210"))
        assert user is not None
        seller_profile = session.scalar(select(SellerProfile).where(SellerProfile.user_id == user.id))

    assert seller_profile is not None
    assert verify_secret("1234", seller_profile.aadhaar_last4_hash or "")
