import uuid

from sqlalchemy import select

from app.config import settings
from app.core.security import verify_secret
from app.models.otp_request import OTPRequest
from app.models.user import User
from app.services import auth_service


def issue_otp(client, monkeypatch, otp: str = "123456") -> dict:
    sent = {}

    async def fake_send(phone: str, code: str) -> str:
        sent["phone"] = phone
        sent["otp"] = code
        return "provider-request-id"

    monkeypatch.setattr(auth_service, "generate_otp", lambda: otp)
    monkeypatch.setattr(auth_service, "send_otp", fake_send)

    response = client.post("/api/auth/otp/send", json={"phone": "9876543210"})
    assert response.status_code == 200

    payload = response.json()
    payload["sent"] = sent
    return payload


def test_send_otp_persists_hashed_code_and_normalizes_phone(client, monkeypatch, session_factory):
    payload = issue_otp(client, monkeypatch)

    with session_factory() as session:
        otp_row = session.get(OTPRequest, uuid.UUID(payload["request_id"]))

    assert payload["expires_in"] == 300
    assert payload["sent"] == {"phone": "+919876543210", "otp": "123456"}
    assert otp_row is not None
    assert otp_row.phone == "+919876543210"
    assert verify_secret("123456", otp_row.otp_hash)
    assert otp_row.attempts == 0
    assert otp_row.consumed is False


def test_verify_otp_creates_user_sets_cookie_and_returns_profile(client, monkeypatch, session_factory):
    send_payload = issue_otp(client, monkeypatch, otp="654321")

    verify_response = client.post(
        "/api/auth/otp/verify",
        json={
            "request_id": send_payload["request_id"],
            "phone": "9876543210",
            "otp": "654321",
        },
    )

    assert verify_response.status_code == 200
    body = verify_response.json()
    assert body["token_type"] == "Bearer"
    assert body["is_new_user"] is True
    assert body["user"]["phone"] == "+919876543210"
    assert settings.refresh_cookie_name in verify_response.cookies

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["seller_profile"] is None

    with session_factory() as session:
        otp_row = session.get(OTPRequest, uuid.UUID(send_payload["request_id"]))
        user = session.scalar(select(User).where(User.phone == "+919876543210"))
    assert otp_row is not None and otp_row.consumed is True
    assert user is not None and user.phone == "+919876543210"


def test_verify_otp_enforces_attempt_limit(client, monkeypatch, session_factory):
    send_payload = issue_otp(client, monkeypatch, otp="111111")

    for attempt in range(1, 6):
        response = client.post(
            "/api/auth/otp/verify",
            json={
                "request_id": send_payload["request_id"],
                "phone": "+919876543210",
                "otp": "000000",
            },
        )
        assert response.status_code == 401
        expected_code = "OTP_TOO_MANY_ATTEMPTS" if attempt == 5 else "OTP_INVALID"
        assert response.json()["error"]["code"] == expected_code

    with session_factory() as session:
        otp_row = session.get(OTPRequest, uuid.UUID(send_payload["request_id"]))
    assert otp_row is not None
    assert otp_row.attempts == 5
    assert otp_row.consumed is False


def test_refresh_rotates_cookie_and_logout_clears_session(client, monkeypatch):
    send_payload = issue_otp(client, monkeypatch, otp="222222")
    verify_response = client.post(
        "/api/auth/otp/verify",
        json={
            "request_id": send_payload["request_id"],
            "phone": "+919876543210",
            "otp": "222222",
        },
    )
    assert verify_response.status_code == 200

    initial_refresh = client.cookies.get(settings.refresh_cookie_name)
    assert initial_refresh

    refresh_response = client.post("/api/auth/refresh")
    assert refresh_response.status_code == 200
    rotated_refresh = client.cookies.get(settings.refresh_cookie_name)
    assert rotated_refresh
    assert rotated_refresh != initial_refresh

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 204

    refresh_after_logout = client.post("/api/auth/refresh")
    assert refresh_after_logout.status_code == 401
    assert refresh_after_logout.json()["error"]["code"] == "UNAUTHENTICATED"
