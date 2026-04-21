from __future__ import annotations

import json
from typing import Any

from .config import Settings
from .models import POI

try:
    import psycopg

    PSYCOPG_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency in local dev.
    psycopg = None  # type: ignore[assignment]
    PSYCOPG_AVAILABLE = False


class POIRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def list_pois(
        self,
        city: str,
        origin_lat: float | None = None,
        origin_lon: float | None = None,
    ) -> list[POI]:
        if self._settings.poi_source == "postgis":
            if origin_lat is not None and origin_lon is not None:
                return self._list_pois_postgis_within(city, origin_lat, origin_lon)
            return self._list_pois_postgis(city)
        return self._list_pois_json(city)

    def _list_pois_json(self, city: str) -> list[POI]:
        with self._settings.data_path.open("r", encoding="utf-8") as handle:
            raw_items = json.load(handle)
        return [
            POI.model_validate(item)
            for item in raw_items
            if item.get("city", "hue").lower() == city.lower()
        ]

    def _list_pois_postgis(self, city: str) -> list[POI]:
        if not PSYCOPG_AVAILABLE:
            raise RuntimeError("psycopg is required when POI_SOURCE=postgis.")
        query = """
            SELECT
                poi_id,
                city,
                name,
                ST_Y(geom) AS lat,
                ST_X(geom) AS lon,
                tags,
                visit_minutes,
                ticket_price,
                to_char(opens_at, 'HH24:MI') AS opens_at,
                to_char(closes_at, 'HH24:MI') AS closes_at,
                outdoor,
                priority,
                description
            FROM poi_catalog
            WHERE lower(city) = lower(%s)
            ORDER BY priority DESC, name ASC
        """
        with psycopg.connect(self._settings.postgis_dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(query, (city,))
                rows = cur.fetchall()

        return [POI.model_validate(self._row_to_poi(row)) for row in rows]

    def _list_pois_postgis_within(self, city: str, origin_lat: float, origin_lon: float) -> list[POI]:
        """Spatial prefilter: POIs within ``POI_PREFILTER_RADIUS_METERS`` of the trip origin."""
        if not PSYCOPG_AVAILABLE:
            raise RuntimeError("psycopg is required when POI_SOURCE=postgis.")
        radius = self._settings.poi_prefilter_radius_meters
        query = """
            SELECT
                poi_id,
                city,
                name,
                ST_Y(geom) AS lat,
                ST_X(geom) AS lon,
                tags,
                visit_minutes,
                ticket_price,
                to_char(opens_at, 'HH24:MI') AS opens_at,
                to_char(closes_at, 'HH24:MI') AS closes_at,
                outdoor,
                priority,
                description
            FROM poi_catalog
            WHERE lower(city) = lower(%s)
              AND ST_DWithin(
                geom::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                %s
              )
            ORDER BY priority DESC, name ASC
        """
        with psycopg.connect(self._settings.postgis_dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(query, (city, origin_lon, origin_lat, radius))
                rows = cur.fetchall()

        return [POI.model_validate(self._row_to_poi(row)) for row in rows]

    def _row_to_poi(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "poi_id": row[0],
            "city": row[1],
            "name": row[2],
            "lat": float(row[3]),
            "lon": float(row[4]),
            "tags": list(row[5] or []),
            "visit_minutes": int(row[6]),
            "ticket_price": int(row[7]),
            "opens_at": row[8],
            "closes_at": row[9],
            "outdoor": bool(row[10]),
            "priority": int(row[11]),
            "description": row[12] or "",
        }

