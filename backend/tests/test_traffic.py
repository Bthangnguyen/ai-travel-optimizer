import unittest
from unittest.mock import patch, MagicMock # Bỏ AsyncMock đi
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.routes.traffic import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

class TrafficAPITests(unittest.TestCase):
    def setUp(self) -> None:
        import backend.app.routes.traffic as traffic_mod

        traffic_mod._traffic_cache.clear()

    @patch("backend.app.routes.traffic.os.getenv")
    def test_no_token_returns_ok_silently(self, mock_getenv) -> None:
        mock_getenv.return_value = None
        
        response = client.get(
            "/traffic/check-leg?origin_lat=16.4&origin_lon=107.5&dest_lat=16.5&dest_lon=107.6&osrm_expected_minutes=15"
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reroute"], False)
        self.assertEqual(response.json()["delay_minutes"], 0)

    @patch("backend.app.routes.traffic.os.getenv")
    @patch("backend.app.routes.traffic.httpx.AsyncClient.get")
    def test_heavy_traffic_triggers_reroute(self, mock_get, mock_getenv) -> None:
        mock_getenv.return_value = "fake_mapbox_token"
        
        # [VÁ LỖI Ở ĐÂY] Dùng MagicMock thay vì AsyncMock cho response
        mock_response = MagicMock() 
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [{"legs": [{"duration": 3000}]}]
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.get(
            "/traffic/check-leg?origin_lat=16.4&origin_lon=107.5&dest_lat=16.5&dest_lon=107.6&osrm_expected_minutes=15"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "HEAVY_TRAFFIC")
        self.assertTrue(data["reroute"])
        self.assertEqual(data["delay_minutes"], 35)

    @patch("backend.app.routes.traffic.os.getenv")
    @patch("backend.app.routes.traffic.httpx.AsyncClient.get")
    def test_normal_traffic_no_reroute(self, mock_get, mock_getenv) -> None:
        mock_getenv.return_value = "fake_mapbox_token"
        
        # [VÁ LỖI Ở ĐÂY] Dùng MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [{"legs": [{"duration": 1200}]}]
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.get(
            "/traffic/check-leg?origin_lat=16.4&origin_lon=107.5&dest_lat=16.5&dest_lon=107.6&osrm_expected_minutes=15"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "OK")
        self.assertFalse(data["reroute"])
        self.assertEqual(data["delay_minutes"], 5)

if __name__ == "__main__":
    unittest.main(verbosity=2)