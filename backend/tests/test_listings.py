from app.services import auth_service


def login_user(client, monkeypatch, *, email: str, otp: str = "123456") -> dict:
    async def fake_send(email_address: str, code: str) -> str:
        return "provider-request-id"

    monkeypatch.setattr(auth_service, "generate_otp", lambda: otp)
    monkeypatch.setattr(auth_service, "send_login_otp_email", fake_send)

    send_response = client.post("/api/auth/otp/send", json={"email": email})
    assert send_response.status_code == 200

    verify_response = client.post(
        "/api/auth/otp/verify",
        json={
            "request_id": send_response.json()["request_id"],
            "email": email,
            "otp": otp,
        },
    )
    assert verify_response.status_code == 200
    return verify_response.json()


def seller_headers(client, monkeypatch, *, email: str = "seller@example.com") -> dict[str, str]:
    login = login_user(client, monkeypatch, email=email)
    token = login["access_token"]
    client.patch(
        "/api/users/me",
        json={"name": "Aman Seller"},
        headers={"Authorization": f"Bearer {token}"},
    )
    client.post("/api/users/become-seller", headers={"Authorization": f"Bearer {token}"})
    client.post(
        "/api/users/seller/upi",
        json={"upi_id": "aman@okhdfcbank"},
        headers={"Authorization": f"Bearer {token}"},
    )
    return {"Authorization": f"Bearer {token}"}


def test_service_catalog_returns_supported_services(client):
    response = client.get("/api/listings/services/catalog")

    assert response.status_code == 200
    items = response.json()
    assert any(item["slug"] == "netflix-premium" for item in items)
    assert all(item["tos_sharing_allowed"] is True for item in items)


def test_create_listing_requires_seller_onboarding_completion(client, monkeypatch):
    login = login_user(client, monkeypatch, email="seller@example.com")
    token = login["access_token"]
    client.post("/api/users/become-seller", headers={"Authorization": f"Bearer {token}"})

    response = client.post(
        "/api/listings",
        json={
            "service_slug": "netflix-premium",
            "price_paise": 17900,
            "duration_days": 30,
            "slots_total": 2,
            "description": "Family plan slot",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "SELLER_ONBOARDING_INCOMPLETE"


def test_seller_can_create_and_update_listing(client, monkeypatch):
    headers = seller_headers(client, monkeypatch)

    create_response = client.post(
        "/api/listings",
        json={
            "service_slug": "netflix-premium",
            "price_paise": 17900,
            "duration_days": 30,
            "slots_total": 2,
            "description": "Family plan slot",
        },
        headers=headers,
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["service_name"] == "Netflix Premium"
    assert created["status"] == "draft"
    assert created["seller"]["name"] == "Aman S."

    patch_response = client.patch(
        f"/api/listings/{created['id']}",
        json={"price_paise": 19900, "slots_total": 3, "status": "active"},
        headers=headers,
    )

    assert patch_response.status_code == 200
    updated = patch_response.json()
    assert updated["price_paise"] == 19900
    assert updated["slots_total"] == 3
    assert updated["slots_available"] == 3
    assert updated["status"] == "active"


def test_public_listing_list_and_detail_work_for_active_listing(client, monkeypatch):
    headers = seller_headers(client, monkeypatch)
    create_response = client.post(
        "/api/listings",
        json={
            "service_slug": "spotify-family",
            "price_paise": 4900,
            "duration_days": 30,
            "slots_total": 2,
            "description": "Fresh slot",
        },
        headers=headers,
    )
    listing_id = create_response.json()["id"]
    client.patch(
        f"/api/listings/{listing_id}",
        json={"status": "active"},
        headers=headers,
    )

    list_response = client.get("/api/listings", params={"service_slug": "spotify-family"})
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1
    assert list_response.json()["items"][0]["id"] == listing_id

    detail_response = client.get(f"/api/listings/{listing_id}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["id"] == listing_id
    assert detail["views"] == 1
    assert detail["recent_reviews"] == []


def test_my_listings_and_public_seller_profile_return_expected_shapes(client, monkeypatch):
    headers = seller_headers(client, monkeypatch)
    client.post(
        "/api/listings",
        json={
            "service_slug": "canva-pro-teams",
            "price_paise": 9900,
            "duration_days": 30,
            "slots_total": 1,
            "description": "Design team slot",
        },
        headers=headers,
    )

    me_response = client.get("/api/auth/me", headers=headers)
    seller_user_id = me_response.json()["id"]

    my_listings_response = client.get("/api/listings/me", headers=headers)
    assert my_listings_response.status_code == 200
    payload = my_listings_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["total_revenue_paise"] == 0
    assert payload["items"][0]["active_orders"] == 0
    assert payload["items"][0]["has_credentials"] is False

    public_profile_response = client.get(f"/api/users/seller/{seller_user_id}/public")
    assert public_profile_response.status_code == 200
    assert public_profile_response.json()["name"] == "Aman S."
    assert public_profile_response.json()["kyc_verified"] is False


def test_delete_listing_soft_removes_it(client, monkeypatch):
    headers = seller_headers(client, monkeypatch)
    create_response = client.post(
        "/api/listings",
        json={
            "service_slug": "notion-plus-team",
            "price_paise": 7900,
            "duration_days": 30,
            "slots_total": 2,
            "description": "Workspace seat",
        },
        headers=headers,
    )
    listing_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/listings/{listing_id}", headers=headers)
    assert delete_response.status_code == 204

    my_listings_response = client.get("/api/listings/me", headers=headers)
    assert my_listings_response.status_code == 200
    assert my_listings_response.json()["total"] == 0
