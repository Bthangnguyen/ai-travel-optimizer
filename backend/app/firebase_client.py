from __future__ import annotations

import json
from typing import Any

import firebase_admin
from firebase_admin import credentials, exceptions as firebase_exceptions, messaging

from .config import Settings
from .models import PlanResponse


class FCMClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._enabled = False
        self._initialize(settings)

    def _initialize(self, settings: Settings) -> None:
        service_account = settings.firebase_service_account_path
        if not service_account:
            return

        try:
            cred = credentials.Certificate(service_account)
            try:
                firebase_admin.get_app()
            except ValueError:
                firebase_admin.initialize_app(cred)
            self._enabled = True
        except Exception:
            self._enabled = False

    @property
    def enabled(self) -> bool:
        return self._enabled

    def send_reroute_update(
        self,
        device_token: str,
        trip: PlanResponse,
        delay_minutes: int,
    ) -> str:
        if not self._enabled:
            raise RuntimeError("Firebase service is not configured.")

        reroute_payload: dict[str, Any] = trip.model_dump(mode="json")
        reroute_payload["meta"] = {
            "delay_minutes": delay_minutes,
            "event": "reroute_applied",
        }

        message = messaging.Message(
            token=device_token,
            notification=messaging.Notification(
                title="Lịch trình đã được tính lại",
                body="Lộ trình mới đã được cập nhật ngầm do trễ giờ.",
            ),
            data={
                "trip_id": trip.trip_id,
                "delay_minutes": str(delay_minutes),
                "engine_used": trip.engine_used,
                "fallback_level": str(trip.fallback_level),
                "event": "reroute_applied",
                "reroute": json.dumps(reroute_payload, ensure_ascii=False),
            },
        )

        return messaging.send(message)
