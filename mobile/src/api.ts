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

// ─── Payload types ────────────────────────────────────────────────────────────

type PlanPayload = {
  prompt: string;
  weather?: "clear" | "rain";
};

/** Payload cho nút thủ công "I'm delayed" / "It's raining" — vẫn giữ lại cho UI */
type ReroutePayload = {
  tripId: string;
  kind: "delayed" | "rain";
  minutesLate?: number;
  visitedPoiIds?: string[];
};

/**
 * Payload từ geofence.ts — trigger tự động khi user rời điểm dừng trễ hơn lịch.
 * trigger.kind = "geofence" theo contracts/reroute-request.schema.json
 */
export type GeofenceReroutePayload = {
  tripId: string;
  minutesLate: number;
  visitedPoiIds: string[];
  /** Giờ thực tế lúc EXIT, format "HH:MM" — backend dùng để tính lại lịch chính xác */
  currentTime: string;
};

// ─── Core request helper ──────────────────────────────────────────────────────

async function requestJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as { status: string };
}

export function createPlan(payload: PlanPayload): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/plan", payload);
}

/** Reroute thủ công từ nút "I'm delayed" / "It's raining" trong UI */
export function reroutePlan(payload: ReroutePayload): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/reroute", {
    trip_id: payload.tripId,
    visited_poi_ids: payload.visitedPoiIds ?? [],
    trigger: {
      kind: payload.kind,
      minutes_late: payload.minutesLate ?? 0,
    },
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
    current_time: payload.currentTime,
    visited_poi_ids: payload.visitedPoiIds,
    trigger: {
      kind: "geofence",
      minutes_late: payload.minutesLate,
    },
  });
}
