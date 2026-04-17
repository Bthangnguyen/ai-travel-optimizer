from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from backend.app.main import app, planner
from backend.app.models import PlanRequest


class ApiTests(unittest.TestCase):
    def test_reroute_cooldown_returns_429(self) -> None:
        client = TestClient(app)
        initial = client.post(
            "/plan",
            json={"prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops"},
        )
        self.assertEqual(200, initial.status_code)
        trip_id = initial.json()["trip_id"]

        first = client.post(
            "/reroute",
            json={"trip_id": trip_id, "trigger": {"kind": "delayed", "minutes_late": 30}},
        )
        second = client.post(
            "/reroute",
            json={"trip_id": trip_id, "trigger": {"kind": "delayed", "minutes_late": 30}},
        )

        self.assertEqual(200, first.status_code)
        self.assertEqual(429, second.status_code)

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
