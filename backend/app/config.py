from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal


def _load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


@dataclass(slots=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "AI Dynamic Itinerary Optimizer")
    default_city: str = os.getenv("DEFAULT_CITY", "hue")
    default_origin_name: str = os.getenv("DEFAULT_ORIGIN_NAME", "Hue City Center")
    default_origin_lat: float = float(os.getenv("DEFAULT_ORIGIN_LAT", "16.4637"))
    default_origin_lon: float = float(os.getenv("DEFAULT_ORIGIN_LON", "107.5909"))
    osrm_base_url: str = os.getenv("OSRM_BASE_URL", "http://localhost:5000")
    data_path: Path = Path(
        os.getenv(
            "DATA_PATH",
            str(Path(__file__).resolve().parents[2] / "data" / "sample_pois.json"),
        )
    )
    redis_url: str = os.getenv("REDIS_URL", "")
    reroute_cooldown_seconds: int = int(os.getenv("REROUTE_COOLDOWN_SECONDS", "180"))
    llm_provider: Literal["openai", "gemini"] = os.getenv("LLM_PROVIDER", "openai")  # type: ignore[assignment]
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    llm_timeout_seconds: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "0.9"))
    llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "3"))
    llm_openai_base_url: str = os.getenv("LLM_OPENAI_BASE_URL", "")
    llm_gemini_base_url: str = os.getenv(
        "LLM_GEMINI_BASE_URL",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")

    def validate_llm_credentials(self) -> None:
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is missing. Add it to environment or .env for production startup."
            )
        if self.llm_provider == "gemini" and not self.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is missing. Add it to environment or .env for production startup."
            )

    def selected_api_key(self) -> str:
        self.validate_llm_credentials()
        if self.llm_provider == "openai":
            return self.openai_api_key
        return self.gemini_api_key

    def selected_base_url(self) -> str | None:
        if self.llm_provider == "gemini":
            return self.llm_gemini_base_url
        if self.llm_openai_base_url:
            return self.llm_openai_base_url
        return None


_load_dotenv(Path(__file__).resolve().parents[2] / ".env")
settings = Settings()

