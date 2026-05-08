from app.services import health_service


def test_health_check_success(client, monkeypatch):
    async def fake_db_check() -> bool:
        return True

    async def fake_redis_check() -> bool:
        return True

    monkeypatch.setattr(health_service, "check_database_connection", fake_db_check)
    monkeypatch.setattr(health_service, "check_redis_connection", fake_redis_check)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "version": "0.1.0",
        "db": "ok",
        "redis": "ok",
    }


def test_health_check_degraded_when_dependencies_fail(client, monkeypatch):
    async def fake_db_check() -> bool:
        return False

    async def fake_redis_check() -> bool:
        return False

    monkeypatch.setattr(health_service, "check_database_connection", fake_db_check)
    monkeypatch.setattr(health_service, "check_redis_connection", fake_redis_check)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert response.json()["db"] == "down"
    assert response.json()["redis"] == "down"
