from __future__ import annotations

import time
import unittest

from fastapi.testclient import TestClient

from backend.app import auth as auth_module
from backend.app.config import settings
from backend.app.main import app


class AuthJwtTests(unittest.TestCase):
    """Exercise the JWT issuance / verification path.

    These tests do not flip the global ``AUTH_MODE`` so the existing
    ``X-API-Key`` suite continues to pass. Instead we temporarily patch
    ``settings`` inside the individual tests that need it.
    """

    def setUp(self) -> None:
        self._previous_mode = settings.auth_mode
        self._previous_secret = settings.jwt_signing_secret
        settings.jwt_signing_secret = "test-signing-secret"

    def tearDown(self) -> None:
        settings.auth_mode = self._previous_mode
        settings.jwt_signing_secret = self._previous_secret

    def test_issue_and_verify_jwt_roundtrip(self) -> None:
        token = auth_module.create_device_jwt("device-abc", expires_in_seconds=60)
        self.assertEqual(token.count("."), 2)
        self.assertEqual("device-abc", auth_module.verify_device_jwt(token))

    def test_verify_rejects_tampered_signature(self) -> None:
        token = auth_module.create_device_jwt("device-abc", expires_in_seconds=60)
        header, payload, _ = token.split(".")
        tampered = f"{header}.{payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        with self.assertRaises(Exception) as ctx:
            auth_module.verify_device_jwt(tampered)
        self.assertEqual(401, getattr(ctx.exception, "status_code", None))

    def test_verify_rejects_expired_token(self) -> None:
        token = auth_module.create_device_jwt("device-abc", expires_in_seconds=1)
        time.sleep(1.5)
        with self.assertRaises(Exception) as ctx:
            auth_module.verify_device_jwt(token)
        self.assertEqual(401, getattr(ctx.exception, "status_code", None))

    def test_auth_token_endpoint_requires_bearer_mode(self) -> None:
        settings.auth_mode = "internal_key"
        client = TestClient(app)
        response = client.post("/auth/token", json={"device_token": "device-xyz"})
        self.assertEqual(400, response.status_code)

    def test_auth_token_endpoint_issues_valid_token(self) -> None:
        settings.auth_mode = "bearer_jwt"
        client = TestClient(app)
        response = client.post("/auth/token", json={"device_token": "device-xyz"})
        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertIn("token", body)
        self.assertEqual("Bearer", body["token_type"])
        self.assertEqual(settings.jwt_expires_in_seconds, body["expires_in"])
        self.assertEqual("device-xyz", auth_module.verify_device_jwt(body["token"]))

    def test_bearer_mode_gates_plan_endpoint(self) -> None:
        settings.auth_mode = "bearer_jwt"
        client = TestClient(app)

        unauth = client.post(
            "/plan",
            json={"prompt": "Plan a Hue trip", "device_token": "d1"},
        )
        self.assertEqual(401, unauth.status_code)

        stale = client.post(
            "/plan",
            json={"prompt": "Plan a Hue trip", "device_token": "d1"},
            headers={settings.internal_api_key_header: settings.internal_api_key},
        )
        self.assertEqual(401, stale.status_code)

        token = auth_module.create_device_jwt("d1", expires_in_seconds=60)
        ok = client.post(
            "/plan",
            json={
                "prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops",
                "device_token": "d1",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(200, ok.status_code)

    def test_bearer_rejects_mismatched_device_token(self) -> None:
        settings.auth_mode = "bearer_jwt"
        client = TestClient(app)
        token = auth_module.create_device_jwt("d1", expires_in_seconds=60)
        bad = client.post(
            "/plan",
            json={
                "prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops",
                "device_token": "other-device",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(401, bad.status_code)

    def test_hybrid_mode_accepts_both(self) -> None:
        settings.auth_mode = "hybrid"
        client = TestClient(app)

        token = auth_module.create_device_jwt("d2", expires_in_seconds=60)
        bearer_response = client.post(
            "/plan",
            json={
                "prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops",
                "device_token": "d2",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(200, bearer_response.status_code)

        key_response = client.post(
            "/plan",
            json={
                "prompt": "Plan a Hue trip from 08:00 with culture, budget 1200000, 5 stops",
                "device_token": "d2-again",
            },
            headers={settings.internal_api_key_header: settings.internal_api_key},
        )
        self.assertEqual(200, key_response.status_code)


if __name__ == "__main__":
    unittest.main()
