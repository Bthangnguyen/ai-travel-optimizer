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

  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";
}

export const API_URL = resolveApiUrl();

type PlanPayload = {
  prompt: string;
  weather?: "clear" | "rain";
};

type ReroutePayload = {
  tripId: string;
  kind: "delayed" | "rain";
  minutesLate?: number;
  visitedPoiIds?: string[];
};

async function requestJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

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

export function reroutePlan(payload: ReroutePayload): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/reroute", {
    trip_id: payload.tripId,
    visited_poi_ids: payload.visitedPoiIds ?? [],
    trigger: {
      kind: payload.kind,
      minutes_late: payload.minutesLate ?? 0
    },
    weather: payload.kind === "rain" ? "rain" : undefined
  });
}
