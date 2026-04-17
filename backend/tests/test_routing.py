from __future__ import annotations

import unittest

from backend.app.models import ConstraintBundle, POI
from backend.app.routing_solver import RoutingSolver

class RoutingSolverPhysicsTests(unittest.TestCase):
    def test_physics_time_windows_and_wait_time(self) -> None:
        """
        Bài test cực đoan để kiểm chứng 2 lỗ hổng:
        1. Khóa trái cửa: Không cho phép departure_minutes > closes_at.
        2. Thời gian ma: Phải tính đúng wait_minutes nếu khách đến sớm hơn giờ mở cửa.
        """
        solver = RoutingSolver()
        constraints = ConstraintBundle(
            budget_max=1_000_000,
            soft_tags=["culture"],
            hard_start="08:00", # Bắt đầu lúc 08:00 (480 phút)
            hard_end="20:00",
            max_stops=5,
        )

        pois = [
            POI(
                poi_id="a",
                name="Điểm A (Test Đợi Cửa)",
                lat=0.0, lon=0.0, tags=["culture"],
                visit_minutes=60, ticket_price=10_000,
                opens_at="09:00",  # Bẫy 1: 9h mới mở cửa
                closes_at="18:00",
                priority=10, outdoor=False
            ),
            POI(
                poi_id="b",
                name="Điểm B (Test Khóa Trái Cửa)",
                lat=0.0, lon=1.0, tags=["culture"],
                visit_minutes=120, ticket_price=10_000, # Bẫy 2: Chơi mất 2 tiếng
                opens_at="08:00",
                closes_at="17:00", # Bẫy 2: 17h đóng cửa, vậy arrival phải <= 15:00
                priority=9, outdoor=False
            ),
        ]

        # Matrix 3x3: Start(0), Điểm A(1), Điểm B(2)
        # Bẫy 1: Từ Start -> A mất 15 phút. 
        # Xuất phát 08:00 -> 08:15 tới nơi -> Phải đợi 45 phút tới 09:00.
        matrix = [
            [0, 15, 60], 
            [15, 0, 30], 
            [60, 30, 0]  
        ]

        result = solver.solve(
            pois=pois,
            matrix=matrix,
            constraints=constraints,
            weather="clear",
            start_time=8 * 60, # 480
        )

        self.assertGreater(len(result.scheduled), 0, "Thuật toán không trả về lộ trình nào!")

        for stop in result.scheduled:
            poi = stop.poi
            
            # --- ASSERT 1: KHÔNG BỊ KHÓA TRÁI CỬA ---
            close_at_mins = int(poi.closes_at.split(':')[0]) * 60 + int(poi.closes_at.split(':')[1])
            self.assertLessEqual(
                stop.departure_minutes, 
                close_at_mins, 
                f"❌ LỖI VẬT LÝ: Bị khóa trái ở {poi.name}! Cửa đóng lúc {poi.closes_at} nhưng {stop.departure_minutes//60:02d}:{stop.departure_minutes%60:02d} khách mới tham quan xong!"
            )

            # --- ASSERT 2: KHÔNG CÓ THỜI GIAN MA ---
            if poi.poi_id == "a":
                self.assertTrue(
                    hasattr(stop, "wait_minutes"), 
                    "❌ THIẾU BIẾN: Struct SolverStop chưa có thuộc tính `wait_minutes`!"
                )
                self.assertEqual(
                    stop.wait_minutes, 
                    45, 
                    f"❌ LỖI THỜI GIAN MA: Khách đến Điểm A lúc 08:15, 09:00 mở cửa. Đáng lẽ phải chờ 45p, nhưng hệ thống báo chờ {stop.wait_minutes}p."
                )

        print("\n" + "="*50)
        print("✅ PASSED: THUẬT TOÁN ĐÃ ĐẠT CHUẨN VẬT LÝ KHÔNG GIAN - THỜI GIAN!")
        print("Chi tiết lộ trình sau khi vá lỗi:")
        for stop in result.scheduled:
            arr_h, arr_m = divmod(stop.arrival_minutes, 60)
            dep_h, dep_m = divmod(stop.departure_minutes, 60)
            print(f"📍 {stop.poi.name} | Thời gian chờ cửa: {getattr(stop, 'wait_minutes', 0)}p | Bắt đầu chơi: {arr_h:02d}:{arr_m:02d} | Kết thúc: {dep_h:02d}:{dep_m:02d}")
        print("="*50 + "\n")

if __name__ == "__main__":
    unittest.main(verbosity=2)