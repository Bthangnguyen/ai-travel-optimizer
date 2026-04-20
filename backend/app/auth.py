"""Authentication helpers for protecting public API endpoints.

The backend supports four modes controlled by the ``AUTH_MODE`` environment
variable (see :class:`backend.app.config.Settings`):

* ``internal_key`` - legacy demo mode. Requests must include the static
  ``X-API-Key`` header. Suitable for LAN / internal demos only.
* ``bearer_jwt`` - public-safe mode. Requests must carry
  ``Authorization: Bearer <jwt>`` where the JWT is issued by ``POST /auth/token``
  (HS256, signed with ``JWT_SIGNING_SECRET``, bound to the caller's device
  token). The X-API-Key header is rejected.
* ``hybrid`` - accepts either of the two above. Useful during migration so
  existing internal tools keep working while mobile rolls out bearer tokens.
* ``disabled`` - no authentication. Development only.

The JWT implementation is intentionally minimal (HS256 via ``hmac``/``hashlib``)
so the project keeps a slim dependency footprint. We can swap this out for
Firebase ID token verification later without touching any endpoint code - only
:func:`require_auth` needs updating.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass

from fastapi import Header, HTTPException

from .config import settings


@dataclass(slots=True)
class AuthenticatedClient:
    """Represents a successfully authenticated caller."""

    device_token: str
    mode: str


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_device_jwt(device_token: str, expires_in_seconds: int | None = None) -> str:
    """Issue a short-lived HS256 JWT bound to a device token.

    Raises :class:`RuntimeError` if the signing secret is not configured so
    that misconfiguration fails loudly at startup rather than silently
    producing unverifiable tokens.
    """
    if not device_token or not str(device_token).strip():
        raise ValueError("device_token must be a non-empty string.")
    if not settings.jwt_signing_secret:
        raise RuntimeError(
            "JWT_SIGNING_SECRET is not configured. Set it before issuing tokens."
        )

    ttl = expires_in_seconds if expires_in_seconds is not None else settings.jwt_expires_in_seconds
    issued_at = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(device_token).strip(),
        "iat": issued_at,
        "exp": issued_at + int(ttl),
    }
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(
        settings.jwt_signing_secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def verify_device_jwt(token: str) -> str:
    """Validate a bearer token and return its ``sub`` (device token)."""
    if not settings.jwt_signing_secret:
        raise HTTPException(status_code=503, detail="Server auth not configured.")

    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Malformed token.")
    header_b64, payload_b64, signature_b64 = parts

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_sig = hmac.new(
        settings.jwt_signing_secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    try:
        provided_sig = _b64url_decode(signature_b64)
    except (ValueError, base64.binascii.Error) as exc:  # type: ignore[attr-defined]
        raise HTTPException(status_code=401, detail="Malformed token signature.") from exc
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise HTTPException(status_code=401, detail="Invalid token signature.")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Malformed token payload.")

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp <= int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired.")

    device_token = payload.get("sub")
    if not isinstance(device_token, str) or not device_token.strip():
        raise HTTPException(status_code=401, detail="Token missing subject.")
    return device_token.strip()


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2:
        return None
    scheme, token = parts
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def require_auth(
    api_key: str | None = Header(default=None, alias=settings.internal_api_key_header),
    authorization: str | None = Header(default=None),
) -> AuthenticatedClient:
    """FastAPI dependency that gates access based on ``AUTH_MODE``."""
    mode = (settings.auth_mode or "internal_key").strip().lower()

    if mode == "disabled" or not settings.internal_api_auth_enabled:
        return AuthenticatedClient(device_token="", mode="disabled")

    bearer_token = _extract_bearer(authorization)

    if mode == "bearer_jwt":
        if bearer_token is None:
            raise HTTPException(status_code=401, detail="Authorization bearer token required.")
        device_token = verify_device_jwt(bearer_token)
        return AuthenticatedClient(device_token=device_token, mode="bearer_jwt")

    if mode == "hybrid" and bearer_token is not None:
        device_token = verify_device_jwt(bearer_token)
        return AuthenticatedClient(device_token=device_token, mode="bearer_jwt")

    if mode in {"internal_key", "hybrid"}:
        expected_key = (settings.internal_api_key or "").strip()
        if not expected_key:
            raise HTTPException(status_code=503, detail="Server auth not configured.")
        if api_key != expected_key:
            raise HTTPException(status_code=401, detail="Invalid or missing API key.")
        return AuthenticatedClient(device_token="", mode="internal_key")

    raise HTTPException(status_code=401, detail="Authorization required.")


def assert_device_token_matches_auth(
    auth: AuthenticatedClient,
    device_token: str | None,
) -> None:
    """When using bearer JWT, the request body must carry the same device_token as JWT ``sub``."""
    if auth.mode != "bearer_jwt":
        return
    body = (device_token or "").strip()
    if not body:
        raise HTTPException(
            status_code=401,
            detail="device_token is required and must match the bearer token subject.",
        )
    if body != auth.device_token:
        raise HTTPException(
            status_code=401,
            detail="device_token does not match JWT subject.",
        )
