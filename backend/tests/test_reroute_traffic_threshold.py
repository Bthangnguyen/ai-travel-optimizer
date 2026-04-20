from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.main import app
from backend.app.routes.traffic import LegTrafficAssessment


def test_reroute_skipped_when_live_delay_below_threshold(monkeypatch) -> None:
    async def fake_assess_leg_traffic(**_: object) -> LegTrafficAssessment:
        return LegTrafficAssessment(status="OK", delay_minutes=3, reroute=False)

    monkeypatch.setattr("backend.app.main.assess_leg_traffic", fake_assess_leg_traffic)
    client = TestClient(app)
    headers = {settings.internal_api_key_header: settings.internal_api_key}
    initial = client.post(
        "/plan",
        json={"prompt": "Huế trip with food and culture", "device_token": "traffic_test_token"},
        headers=headers,
    )
    assert initial.status_code == 200
    trip_id = initial.json()["trip_id"]

    reroute = client.post(
        "/reroute",
        json={
            "trip_id": trip_id,
            "device_token": "traffic_test_token",
            "trigger": {"kind": "delayed", "minutes_late": 5},
        },
        headers=headers,
    )

    assert reroute.status_code == 200
    notes = reroute.json()["diagnostics"]["notes"]
    assert any("Reroute skipped" in note for note in notes)
