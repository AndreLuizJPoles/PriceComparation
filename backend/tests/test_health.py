"""Smoke tests for health endpoints (bootstrap)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] == "ok"
    assert body["error"] is None


def test_ready() -> None:
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] in {"ready", "degraded"}
    assert body["data"]["checks"]["api"] is True
    assert body["data"]["demo_mode"] is True
