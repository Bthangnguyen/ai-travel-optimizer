from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.main import app, planner
from backend.app.models import PlanRequest


class ApiTests(unittest.TestCase):
    @staticmethod
    def _auth_headers() -> dict[str, str]:
        return {settings.internal_api_key_header: settings.internal_api_key}

    def test_reroute_cooldown_returns_429(self) -> None:
        client = TestClient(app)
        initial = client.post(
            "/plan",
            json={"prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops", "device_token": "test_device_1"},
            headers=self._auth_headers(),
        )
        self.assertEqual(200, initial.status_code)
        trip_id = initial.json()["trip_id"]

        first = client.post(
            "/reroute",
            json={
                "trip_id": trip_id,
                "device_token": "test_device_1",
                "trigger": {"kind": "delayed", "minutes_late": 30},
            },
            headers=self._auth_headers(),
        )
        second = client.post(
            "/reroute",
            json={
                "trip_id": trip_id,
                "device_token": "test_device_1",
                "trigger": {"kind": "delayed", "minutes_late": 30},
            },
            headers=self._auth_headers(),
        )

        self.assertEqual(200, first.status_code)
        self.assertEqual(429, second.status_code)

    def test_plan_requires_api_key(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/plan",
            json={"prompt": "Plan a Hue trip", "device_token": "no_auth_token"},
        )
        self.assertEqual(401, response.status_code)

    def test_reroute_requires_device_token(self) -> None:
        client = TestClient(app)
        initial = client.post(
            "/plan",
            json={"prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops", "device_token": "test_device_2"},
            headers=self._auth_headers(),
        )
        self.assertEqual(200, initial.status_code)
        trip_id = initial.json()["trip_id"]

        response = client.post(
            "/reroute",
            json={
                "trip_id": trip_id,
                "trigger": {"kind": "delayed", "minutes_late": 15},
            },
            headers=self._auth_headers(),
        )
        self.assertEqual(422, response.status_code)

    def test_rain_mode_removes_outdoor_pois(self) -> None:
        trip = planner.plan(
            PlanRequest(
                prompt="Plan a Hue nature and culture route, budget 1500000, 6 stops",
                weather="rain",
            )
        )

        self.assertTrue(trip.itinerary)
        self.assertTrue(all(not stop.outdoor for stop in trip.itinerary))
        self.assertIn(
            "Removed because rain mode avoids outdoor POIs.",
            {item.reason for item in trip.discarded_pois},
        )


if __name__ == "__main__":
    unittest.main()
