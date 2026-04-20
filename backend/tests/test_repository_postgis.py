from __future__ import annotations

from typing import Any

from backend.app.config import Settings
from backend.app.repository import POIRepository


class _FakeCursor:
    def __init__(self, rows: list[tuple[Any, ...]]) -> None:
        self._rows = rows

    def execute(self, _query: str, _params: tuple[str, ...]) -> None:
        return None

    def fetchall(self) -> list[tuple[Any, ...]]:
        return self._rows

    def __enter__(self) -> "_FakeCursor":
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        return False


class _FakeConnection:
    def __init__(self, rows: list[tuple[Any, ...]]) -> None:
        self._rows = rows

    def cursor(self) -> _FakeCursor:
        return _FakeCursor(self._rows)

    def __enter__(self) -> "_FakeConnection":
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        return False


def test_postgis_repository_mode_reads_from_database(monkeypatch) -> None:
    rows = [
        (
            "poi-1",
            "hue",
            "Imperial City",
            16.466,
            107.579,
            ["culture"],
            90,
            200000,
            "08:00",
            "17:00",
            False,
            10,
            "Historic site",
        )
    ]

    class _FakePsycopg:
        @staticmethod
        def connect(_dsn: str) -> _FakeConnection:
            return _FakeConnection(rows)

    monkeypatch.setattr("backend.app.repository.PSYCOPG_AVAILABLE", True)
    monkeypatch.setattr("backend.app.repository.psycopg", _FakePsycopg)

    settings = Settings(poi_source="postgis", postgis_dsn="postgresql://fake")
    repo = POIRepository(settings)
    pois = repo.list_pois("hue")
    assert len(pois) == 1
    assert pois[0].poi_id == "poi-1"
