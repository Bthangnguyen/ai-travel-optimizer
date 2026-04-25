from __future__ import annotations

import json

from .config import Settings
from .models import POI


class POIRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def list_pois(self, city: str) -> list[POI]:
        with self._settings.data_path.open("r", encoding="utf-8") as handle:
            raw_items = json.load(handle)
        return [
            POI.model_validate(item)
            for item in raw_items
            if item.get("city", "hue").lower() == city.lower()
        ]

