import { NativeModules, Platform } from "react-native";

import { PlanResponse } from "./types";

function inferHostFromBundleUrl(): string | null {
  const scriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;
  const match = scriptUrl?.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  const host = match?.[1];

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  return host;
}

function resolveApiUrl(): string {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (explicitUrl) {
    return explicitUrl;
  }

  const bundleHost = inferHostFromBundleUrl();
  if (bundleHost) {
    return `http://${bundleHost}:8000`;
  }

  return Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://127.0.0.1:8000";
}

export const API_URL = resolveApiUrl();
const API_KEY_HEADER = process.env.EXPO_PUBLIC_INTERNAL_API_KEY_HEADER || "X-API-Key";
const API_KEY_VALUE = process.env.EXPO_PUBLIC_INTERNAL_API_KEY || "demo-internal-key";
const AUTH_MODE =
  (process.env.EXPO_PUBLIC_AUTH_MODE?.toLowerCase() as
    | "internal_key"
    | "bearer_jwt"
    | undefined) ?? "internal_key";
const REQUEST_TIMEOUT_MS = 10000;

// ─── Bearer JWT support ───────────────────────────────────────────────────────
// The mobile app can plug in a device-token provider so we can obtain a
// short-lived JWT from the backend (POST /auth/token). The token is cached in
// memory until it nears expiry; the cache is invalidated on device-token
// change. Network errors always surface as a thrown Error so callers can show
// the existing offline UI.

type DeviceTokenProvider = () => Promise<string>;
let deviceTokenProvider: DeviceTokenProvider | null = null;
let cachedAuthToken: { token: string; deviceToken: string; expiresAt: number } | null = null;

export function setDeviceTokenProvider(provider: DeviceTokenProvider): void {
  deviceTokenProvider = provider;
  cachedAuthToken = null;
}

export function clearCachedAuthToken(): void {
  cachedAuthToken = null;
}

async function fetchBearerToken(): Promise<string> {
  if (!deviceTokenProvider) {
    throw new Error("Device token provider is not configured for bearer auth.");
  }
  const deviceToken = await deviceTokenProvider();
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    cachedAuthToken &&
    cachedAuthToken.deviceToken === deviceToken &&
    cachedAuthToken.expiresAt - 30 > nowSec
  ) {
    return cachedAuthToken.token;
  }

  const response = await fetchWithTimeout(`${API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_token: deviceToken }),
  });
  if (!response.ok) {
    cachedAuthToken = null;
    const text = await response.text().catch(() => "");
    throw new Error(
      `Auth token request failed with status ${response.status}${text ? `: ${text}` : ""}`,
    );
  }

  const data = (await response.json()) as { token?: string; expires_in?: number };
  if (!data.token || !data.expires_in) {
    throw new Error("Auth token response missing fields.");
  }

  cachedAuthToken = {
    token: data.token,
    deviceToken,
    expiresAt: nowSec + data.expires_in,
  };
  return data.token;
}

async function buildHeaders(includeJsonContentType: boolean = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (AUTH_MODE === "bearer_jwt") {
    const token = await fetchBearerToken();
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    headers[API_KEY_HEADER] = API_KEY_VALUE;
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  retries: number,
): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(input, init);
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        throw error;
      }
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}

// ─── Payload types ────────────────────────────────────────────────────────────

type PlanPayload = {
  prompt: string;
  weather?: "clear" | "rain";
  deviceToken?: string;
};

/** Payload cho nút thủ công "I'm delayed" / "It's raining" — vẫn giữ lại cho UI */
type ReroutePayload = {
  tripId: string;
  kind: "delayed" | "rain";
  deviceToken: string;
  minutesLate?: number;
  currentTime?: string;
  currentLocation?: {
    lat: number;
    lon: number;
  };
  visitedPoiIds?: string[];
};

/**
 * Payload từ geofence.ts — trigger tự động khi user rời điểm dừng trễ hơn lịch.
 * trigger.kind = "geofence" theo contracts/reroute-request.schema.json
 */
export type GeofenceReroutePayload = {
  tripId: string;
  deviceToken: string;
  minutesLate: number;
  visitedPoiIds: string[];
  /** Giờ thực tế lúc EXIT, format "HH:MM" — backend dùng để tính lại lịch chính xác */
  currentTime: string;
};

// ─── Core request helper ──────────────────────────────────────────────────────

async function requestJson<T>(path: string, payload: unknown): Promise<T> {
  const headers = await buildHeaders();
  const response = await fetchWithRetry(
    `${API_URL}${path}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
    0,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetchWithRetry(
    `${API_URL}/health`,
    {
      // /health is intentionally unauthenticated so we can ping from anywhere.
    },
    1,
  );
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as { status: string };
}

export function createPlan(payload: PlanPayload): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/plan", {
    prompt: payload.prompt,
    weather: payload.weather ?? "clear",
    device_token: payload.deviceToken,
  });
}

/** Reroute thủ công từ nút "I'm delayed" / "It's raining" trong UI */
export function reroutePlan(payload: ReroutePayload): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/reroute", {
    trip_id: payload.tripId,
    device_token: payload.deviceToken,
    visited_poi_ids: payload.visitedPoiIds ?? [],
    trigger: {
      kind: payload.kind,
      minutes_late: payload.minutesLate ?? 0,
    },
    current_time: payload.currentTime,
    current_location: payload.currentLocation,
    weather: payload.kind === "rain" ? "rain" : undefined,
  });
}

/**
 * Reroute tự động từ geofence.ts — gọi khi OS xác nhận user rời điểm dừng trễ hơn lịch.
 * Đóng gói đúng format contracts/reroute-request.schema.json với trigger.kind = "geofence"
 */
export function rerouteGeofence(
  payload: GeofenceReroutePayload,
): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/reroute", {
    trip_id: payload.tripId,
    device_token: payload.deviceToken,
    current_time: payload.currentTime,
    visited_poi_ids: payload.visitedPoiIds,
    trigger: {
      kind: "geofence",
      minutes_late: payload.minutesLate,
    },
  });
}
