from __future__ import annotations

import unittest

from backend.app.models import ConstraintBundle, POI
from backend.app.routing_solver import RoutingSolver


class RoutingSolverTests(unittest.TestCase):
    def test_linear_points_keep_a_b_c_order(self) -> None:
        solver = RoutingSolver()
        constraints = ConstraintBundle(
            budget_max=1_000_000,
            soft_tags=["culture"],
            hard_start="08:00",
            hard_end="12:00",
            max_stops=3,
        )
        pois = [
            POI(
                poi_id="a",
                name="A",
                lat=0.0,
                lon=0.0,
                tags=["culture"],
                visit_minutes=30,
                ticket_price=10_000,
                opens_at="08:00",
                closes_at="18:00",
                priority=10,
            ),
            POI(
                poi_id="b",
                name="B",
                lat=0.0,
                lon=1.0,
                tags=["culture"],
                visit_minutes=30,
                ticket_price=10_000,
                opens_at="08:00",
                closes_at="18:00",
                priority=9,
            ),
            POI(
                poi_id="c",
                name="C",
                lat=0.0,
                lon=2.0,
                tags=["culture"],
                visit_minutes=30,
                ticket_price=10_000,
                opens_at="08:00",
                closes_at="18:00",
                priority=8,
            ),
        ]
        matrix = [
            [0, 5, 10, 15],
            [5, 0, 5, 10],
            [10, 5, 0, 5],
            [15, 10, 5, 0],
        ]

        result = solver.solve(
            pois=pois,
            matrix=matrix,
            constraints=constraints,
            weather="clear",
            start_time=8 * 60,
        )

        self.assertEqual(["a", "b", "c"], [stop.poi.poi_id for stop in result.scheduled])


if __name__ == "__main__":
    unittest.main()

