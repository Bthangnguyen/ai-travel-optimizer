from __future__ import annotations

import os
from dataclasses import dataclass, field
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


def _parse_csv_env(name: str, default: str) -> list[str]:
    raw_value = os.getenv(name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _parse_bool_env(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(slots=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "dev")
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
    poi_source: Literal["json", "postgis"] = os.getenv("POI_SOURCE", "json")  # type: ignore[assignment]
    postgis_dsn: str = os.getenv(
        "POSTGIS_DSN",
        "postgresql://itinerary:itinerary@localhost:5432/itinerary",
    )
    redis_url: str = os.getenv("REDIS_URL", "")
    state_store_mode: Literal["hybrid", "redis_required"] = os.getenv(  # type: ignore[assignment]
        "STATE_STORE_MODE",
        "hybrid",
    )
    reroute_cooldown_seconds: int = int(os.getenv("REROUTE_COOLDOWN_SECONDS", "180"))
    reroute_delay_threshold_minutes: int = int(os.getenv("REROUTE_DELAY_THRESHOLD_MINUTES", "15"))
    firebase_service_account_path: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
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
    cors_allowed_origins: list[str] = field(
        default_factory=lambda: _parse_csv_env(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost,http://127.0.0.1",
        )
    )
    cors_allow_credentials: bool = _parse_bool_env("CORS_ALLOW_CREDENTIALS", False)
    internal_api_key: str = os.getenv("INTERNAL_API_KEY", "demo-internal-key")
    internal_api_key_header: str = os.getenv("INTERNAL_API_KEY_HEADER", "X-API-Key")
    internal_api_auth_enabled: bool = _parse_bool_env("INTERNAL_API_AUTH_ENABLED", True)
    auth_mode: Literal["internal_key", "bearer_jwt", "hybrid", "disabled"] = os.getenv(  # type: ignore[assignment]
        "AUTH_MODE",
        "internal_key",
    )
    jwt_signing_secret: str = os.getenv("JWT_SIGNING_SECRET", "")
    jwt_expires_in_seconds: int = int(os.getenv("JWT_EXPIRES_IN_SECONDS", "3600"))
    poi_prefilter_radius_meters: int = int(os.getenv("POI_PREFILTER_RADIUS_METERS", "50000"))
    rate_limit_enabled: bool = _parse_bool_env("RATE_LIMIT_ENABLED", False)
    rate_limit_auth_token_per_minute: int = int(os.getenv("RATE_LIMIT_AUTH_TOKEN_PER_MINUTE", "30"))
    rate_limit_plan_per_minute: int = int(os.getenv("RATE_LIMIT_PLAN_PER_MINUTE", "60"))
    rate_limit_reroute_per_minute: int = int(os.getenv("RATE_LIMIT_REROUTE_PER_MINUTE", "60"))
    rate_limit_traffic_per_minute: int = int(os.getenv("RATE_LIMIT_TRAFFIC_PER_MINUTE", "120"))
    traffic_cache_ttl_seconds: float = float(os.getenv("TRAFFIC_CACHE_TTL_SECONDS", "60"))

    @property
    def requires_redis(self) -> bool:
        if self.state_store_mode == "redis_required":
            return True
        return self.app_env.lower() in {"integration", "prod", "production"}

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


def _validate_settings() -> None:
    if settings.state_store_mode == "redis_required" and not (settings.redis_url or "").strip():
        raise RuntimeError(
            "REDIS_URL is required when STATE_STORE_MODE=redis_required.",
        )
    if settings.app_env.lower() in {"prod", "production"} and not (settings.redis_url or "").strip():
        raise RuntimeError("REDIS_URL is required when APP_ENV is prod or production.")


_validate_settings()

