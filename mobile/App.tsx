import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import {
  API_URL,
  checkHealth,
  clearCachedAuthToken,
  createPlan,
  reroutePlan,
  setDeviceTokenProvider,
} from "./src/api";
import {
  isGeofencingActive,
  startGeofenceMonitoring,
  stopGeofenceMonitoring,
} from "./src/geofence";
import { PlanResponse } from "./src/types";

const STORAGE_KEY = "current_trip";
const DEVICE_TOKEN_KEY = "device_token";
const DEFAULT_PROMPT =
  "Plan a Hue day trip from 08:00 with culture and food, budget 1200000, 5 stops";
const ENABLE_GEOFENCE = process.env.EXPO_PUBLIC_ENABLE_GEOFENCE === "true";
const ENABLE_FCM = process.env.EXPO_PUBLIC_ENABLE_FCM === "true";

type FcmMessage = {
  data?: Record<string, string | undefined>;
};

type MessagingAuthorizationStatus = {
  AUTHORIZED: number;
  PROVISIONAL: number;
};

type MessagingInstance = {
  requestPermission: () => Promise<number>;
  getToken: () => Promise<string>;
  onMessage: (listener: (message: FcmMessage) => void | Promise<void>) => () => void;
  getInitialNotification?: () => Promise<FcmMessage | null>;
  onNotificationOpenedApp?: (listener: (message: FcmMessage) => void | Promise<void>) => () => void;
};

type MessagingModule = {
  (): MessagingInstance;
  AuthorizationStatus: MessagingAuthorizationStatus;
};

function loadMessagingModule(): MessagingModule | null {
  if (!NativeModules.RNFBAppModule) {
    return null;
  }
  try {
    const firebaseMessaging = require("@react-native-firebase/messaging") as {
      default: MessagingModule;
    };
    return firebaseMessaging.default;
  } catch (error) {
    console.warn("Firebase messaging module unavailable:", error);
    return null;
  }
}

function parseRouteCoordinates(trip: PlanResponse | null) {
  if (!trip?.itinerary) return [];
  return trip.itinerary.map((stop) => ({
    latitude: stop.lat,
    longitude: stop.lon
  }));
}

function createUuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
}

function createFallbackDeviceToken(): string {
  return `local-${Platform.OS}-${createUuidV4()}`;
}

function parseStoredTrip(raw: string | null): PlanResponse | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PlanResponse;
  } catch (error) {
    console.warn("Unable to parse stored trip payload:", error);
    return null;
  }
}

export default function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [trip, setTrip] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");
  const [backendMessage, setBackendMessage] = useState("Checking backend connectivity...");
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [geofenceStatus, setGeofenceStatus] = useState<"active" | "inactive" | "error" | "disabled">(
    ENABLE_GEOFENCE ? "inactive" : "disabled"
  );
  const [rerouteNotice, setRerouteNotice] = useState<string | null>(null);
  const tripRef = useRef<PlanResponse | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const parsedTrip = parseStoredTrip(raw);
      if (parsedTrip) {
        tripRef.current = parsedTrip;
        setTrip(parsedTrip);
      } else if (raw) {
        void AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
    AsyncStorage.getItem(DEVICE_TOKEN_KEY).then((token) => {
      if (token) {
        setDeviceToken(token);
      }
    });
  }, []);

  useEffect(() => {
    void runHealthCheck();
  }, []);

  async function getOrCreateDeviceToken(): Promise<string> {
    if (deviceToken) {
      return deviceToken;
    }
    const stored = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (stored) {
      setDeviceToken(stored);
      return stored;
    }
    const fallbackToken = createFallbackDeviceToken();
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, fallbackToken);
    setDeviceToken(fallbackToken);
    return fallbackToken;
  }

  useEffect(() => {
    // Register the device-token provider so src/api.ts can request a bearer
    // JWT from the backend when AUTH_MODE=bearer_jwt. Cached tokens are
    // invalidated whenever the device token itself changes.
    setDeviceTokenProvider(() => getOrCreateDeviceToken());
    clearCachedAuthToken();
  }, [deviceToken]);

  useEffect(() => {
    const messagingModule = loadMessagingModule();
    const disposers: Array<() => void> = [];

    async function applyTripFromMessage(remoteMessage: FcmMessage): Promise<void> {
      if (!remoteMessage.data?.reroute) {
        return;
      }
      try {
        const newTripData = JSON.parse(remoteMessage.data.reroute) as PlanResponse;
        const activeTrip =
          tripRef.current ??
          parseStoredTrip(await AsyncStorage.getItem(STORAGE_KEY));
        if (activeTrip && activeTrip.trip_id !== newTripData.trip_id) {
          console.warn(
            `Skip reroute payload for trip ${newTripData.trip_id} (active trip: ${activeTrip.trip_id})`,
          );
          return;
        }
        await persistTrip(newTripData);
        const delayMins = remoteMessage.data.delay_minutes ?? "0";
        const notice = `Reroute applied (+${delayMins}m delay)`;
        setRerouteNotice(notice);
        Alert.alert("Trip Updated", notice);
      } catch (error) {
        console.error("Failed to process reroute payload from FCM:", error);
      }
    }

    async function bootstrapMessaging(): Promise<void> {
      if (!ENABLE_FCM) {
        await getOrCreateDeviceToken();
        return;
      }

      if (!messagingModule) {
        // Expo Go/native fallback: keep manual reroute path functional.
        await getOrCreateDeviceToken();
        return;
      }

      const messaging = messagingModule();
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
        authStatus === messagingModule.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        console.log("FCM Authorization status:", authStatus);
        const token = await messaging.getToken();
        setDeviceToken(token);
        await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
      } else {
        await getOrCreateDeviceToken();
      }

      disposers.push(messaging.onMessage(async (remoteMessage) => {
        console.log("FCM message received in foreground:", remoteMessage);
        await applyTripFromMessage(remoteMessage);
      }));

      if (typeof messaging.onNotificationOpenedApp === "function") {
        disposers.push(
          messaging.onNotificationOpenedApp((remoteMessage) => {
            void applyTripFromMessage(remoteMessage);
          }),
        );
      }

      if (typeof messaging.getInitialNotification === "function") {
        const initialMessage = await messaging.getInitialNotification();
        if (initialMessage) {
          await applyTripFromMessage(initialMessage);
        }
      }
    }

    void bootstrapMessaging().catch((error) => {
      console.error("FCM bootstrap failed:", error);
    });
    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_GEOFENCE) {
      setGeofenceStatus("disabled");
      return;
    }
    void refreshGeofenceStatus();
    return () => {
      void stopGeofenceMonitoring();
    };
  }, []);

  async function runHealthCheck() {
    setBackendStatus("checking");
    setBackendMessage(`Checking ${API_URL}/health`);

    try {
      const response = await checkHealth();
      setBackendStatus("ok");
      setBackendMessage(`Backend reachable: ${response.status}`);
    } catch (nextError) {
      setBackendStatus("error");
      setBackendMessage(
        nextError instanceof Error ? nextError.message : "Unable to reach backend health endpoint."
      );
    }
  }

  async function persistTrip(nextTrip: PlanResponse) {
    tripRef.current = nextTrip;
    setTrip(nextTrip);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrip));
    if (!ENABLE_GEOFENCE) {
      setGeofenceStatus("disabled");
      return;
    }
    if (nextTrip.itinerary.length > 0) {
      try {
        await startGeofenceMonitoring(nextTrip.itinerary);
        setGeofenceStatus("active");
      } catch (nextError) {
        setGeofenceStatus("error");
        console.error("Failed to start geofence monitoring:", nextError);
      }
    }
  }

  async function refreshGeofenceStatus() {
    if (!ENABLE_GEOFENCE) {
      setGeofenceStatus("disabled");
      return;
    }
    try {
      const active = await isGeofencingActive();
      setGeofenceStatus(active ? "active" : "inactive");
    } catch (nextError) {
      setGeofenceStatus("error");
      console.error("Geofence status check failed:", nextError);
    }
  }

  function hhmmNow(): string {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  async function handleCreatePlan() {
    setLoading(true);
    setError(null);
    try {
      await runHealthCheck();
      const token = await getOrCreateDeviceToken();
      const nextTrip = await createPlan({ prompt, deviceToken: token });
      await persistTrip(nextTrip);
      setRerouteNotice(null);
      await refreshGeofenceStatus();
    } catch (nextError) {
      const detail = nextError instanceof Error ? nextError.message : "Unable to create plan.";
      setError(`API ${API_URL}: ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleReroute(kind: "delayed" | "rain") {
    if (!trip) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getOrCreateDeviceToken();
      await runHealthCheck();
      const nextTrip = await reroutePlan({
        tripId: trip.trip_id,
        deviceToken: token,
        kind,
        minutesLate: kind === "delayed" ? 30 : 0,
        currentTime: hhmmNow(),
      });
      await persistTrip(nextTrip);
      setRerouteNotice(`Manual reroute applied (${kind}).`);
      await refreshGeofenceStatus();
    } catch (nextError) {
      const detail = nextError instanceof Error ? nextError.message : "Unable to reroute.";
      setError(`API ${API_URL}: ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>AI itinerary control room</Text>
        <Text style={styles.title}>Hue dynamic planner</Text>
        <Text style={styles.subtitle}>
          Prompt {"->"} structured constraints {"->"} optimized timeline {"->"} reroute triggers.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip brief</Text>
          <Text style={styles.noteText}>API endpoint: {API_URL}</Text>
          <Text style={styles.noteText}>
            Geofence: {geofenceStatus === "active"
              ? "Active"
              : geofenceStatus === "inactive"
                ? "Inactive"
                : geofenceStatus === "disabled"
                  ? "Disabled for stable release"
                  : "Error"}
          </Text>
          {!ENABLE_FCM ? (
            <Text style={styles.noteText}>Auto reroute via push is temporarily disabled for stable release.</Text>
          ) : null}
          {rerouteNotice ? <Text style={styles.noticeText}>{rerouteNotice}</Text> : null}
          <View style={styles.healthRow}>
            <Text
              style={[
                styles.healthStatus,
                backendStatus === "ok"
                  ? styles.healthOk
                  : backendStatus === "error"
                    ? styles.healthError
                    : styles.healthChecking
              ]}
            >
              {backendStatus === "ok"
                ? "Backend connected"
                : backendStatus === "error"
                  ? "Backend unreachable"
                  : "Checking backend"}
            </Text>
            <Pressable style={styles.healthButton} onPress={runHealthCheck} disabled={loading}>
              <Text style={styles.healthButtonText}>Check backend</Text>
            </Pressable>
          </View>
          <Text style={styles.noteText}>{backendMessage}</Text>
          <TextInput
            multiline
            value={prompt}
            onChangeText={setPrompt}
            style={styles.input}
            placeholder="Describe the trip..."
          />
          <Pressable style={styles.primaryButton} onPress={handleCreatePlan} disabled={loading}>
            <Text style={styles.primaryButtonText}>Generate plan</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable
            style={[styles.secondaryButton, !trip && styles.disabledButton]}
            onPress={() => handleReroute("delayed")}
            disabled={!trip || loading}
          >
            <Text style={styles.secondaryButtonText}>I'm delayed</Text>
          </Pressable>
          <Pressable
            style={[styles.alertButton, !trip && styles.disabledButton]}
            onPress={() => handleReroute("rain")}
            disabled={!trip || loading}
          >
            <Text style={styles.alertButtonText}>It's raining</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator size="large" color="#8c2f39" /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Map snapshot</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 16.4637,
                longitude: 107.5905,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {trip?.itinerary ? trip.itinerary.map((stop) => (
                <Marker
                  key={stop.poi_id}
                  coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                  title={stop.name}
                  description={`Arrival: ${stop.arrival_time}`}
                />
              )) : null}
              {trip?.itinerary && trip.itinerary.length > 1 ? (
                <Polyline
                  coordinates={parseRouteCoordinates(trip)}
                  strokeColor="#8c2f39"
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                />
              ) : null}
            </MapView>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {trip?.itinerary.length ? (
            trip.itinerary.map((stop, index) => {
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();

              const parseTime = (timeStr: string) => {
                if (!timeStr) return 0;
                const parts = timeStr.split(':');
                if (parts.length !== 2) return 0;
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
              };

              const arrivalMins = parseTime(stop.arrival_time);
              const departureMins = parseTime(stop.departure_time);
              const isActive = currentMinutes >= arrivalMins && currentMinutes < departureMins;
              const isLast = index === trip.itinerary.length - 1;

              return (
                <View key={stop.poi_id} style={styles.timelineItemContainer}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineBadge, isActive && styles.timelineBadgeActive]}>
                      <Text style={[styles.timelineBadgeText, isActive && styles.timelineBadgeTextActive]}>
                        {stop.arrival_time}
                      </Text>
                    </View>
                    {!isLast && <View style={styles.verticalLine} />}
                  </View>
                  <View style={[styles.timelineContent, isActive && styles.timelineContentActive]}>
                    <Text style={[styles.timelineTitle, isActive && styles.timelineTitleActive]}>
                      {stop.name}
                    </Text>
                    
                    <View style={styles.chipRow}>
                      <View style={[styles.chip, styles.chipTravel]}>
                        <Text style={styles.chipTravelText}>Travel {stop.travel_minutes}m</Text>
                      </View>
                      <View style={[styles.chip, styles.chipVisit]}>
                        <Text style={styles.chipVisitText}>Visit {stop.visit_minutes}m</Text>
                      </View>
                    </View>

                    <Text style={styles.timelineMeta}>
                      Depart {stop.departure_time} · {stop.tags.join(", ")} · {stop.outdoor ? "Outdoor" : "Indoor"} · {stop.ticket_price} VND
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Generate a plan to see the itinerary timeline.</Text>
          )}
        </View>

        {trip ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Diagnostics</Text>
            <Text style={styles.noteText}>
              Engine: {trip.engine_used} · Fallback level: {trip.fallback_level}
            </Text>
            <Text style={styles.noteText}>
              Candidate count: {trip.diagnostics.candidate_count} · Matrix: {trip.diagnostics.matrix_source}
            </Text>
            {trip.diagnostics.notes.map((note) => (
              <Text key={note} style={styles.noteText}>
                - {note}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f1e3"
  },
  container: {
    padding: 20,
    gap: 16
  },
  eyebrow: {
    color: "#8c2f39",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    fontSize: 32,
    color: "#1d1d1d",
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 15,
    color: "#4f4f4f",
    lineHeight: 22
  },
  card: {
    backgroundColor: "#fffaf2",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#ecdcc0"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#262626"
  },
  input: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8c9aa",
    padding: 14,
    textAlignVertical: "top",
    backgroundColor: "#fff"
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  healthRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between"
  },
  primaryButton: {
    backgroundColor: "#8c2f39",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#1f5c4d",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  alertButton: {
    flex: 1,
    backgroundColor: "#c44900",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.5
  },
  errorText: {
    color: "#b00020",
    fontWeight: "600"
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#efe3cb"
  },
  map: {
    width: "100%",
    height: "100%"
  },
  emptyText: {
    color: "#6b6b6b"
  },
  timelineItemContainer: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 68,
  },
  timelineBadge: {
    width: 68,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ead5b5",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineBadgeActive: {
    backgroundColor: "#8c2f39",
  },
  timelineBadgeText: {
    color: "#5a3c1b",
    fontWeight: "700"
  },
  timelineBadgeTextActive: {
    color: "#fff",
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#d8c9aa",
    opacity: 0.8,
  },
  timelineContent: {
    flex: 1,
    gap: 4,
    paddingBottom: 24,
  },
  timelineContentActive: {
    // any extra styles for active container
  },
  timelineTitle: {
    fontSize: 16,
    color: "#1d1d1d",
    fontWeight: "700"
  },
  timelineTitleActive: {
    color: "#8c2f39",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipTravel: {
    backgroundColor: "#e3f0ff", // pastel blue
  },
  chipVisit: {
    backgroundColor: "#e8f5e9", // pastel green
  },
  chipTravelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2a5b8f",
  },
  chipVisitText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e6a32",
  },
  timelineMeta: {
    color: "#555",
    lineHeight: 20,
    fontSize: 13,
  },
  noteText: {
    color: "#494949",
    lineHeight: 20
  },
  noticeText: {
    color: "#1f5c4d",
    fontWeight: "700",
  },
  healthStatus: {
    fontWeight: "700"
  },
  healthOk: {
    color: "#1f5c4d"
  },
  healthError: {
    color: "#b00020"
  },
  healthChecking: {
    color: "#8c2f39"
  },
  healthButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8c9aa",
    backgroundColor: "#fff"
  },
  healthButtonText: {
    color: "#47311b",
    fontWeight: "700"
  }
});
