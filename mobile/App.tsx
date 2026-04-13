/**
 * App.tsx — Dev 7 integration
 *
 * Thay đổi so với bản cũ:
 *   1. Gọi startGeofenceMonitoring() sau khi createPlan() thành công
 *   2. Dừng geofencing khi tạo plan mới (stopGeofenceMonitoring)
 *   3. Hiển thị trạng thái sensor geofence (đang canh / đã dừng)
 *   4. Thay "Replace this card" placeholder bằng GeofenceMapCard thật
 *   5. Giữ lại nút thủ công "I'm delayed" / "It's raining" như fallback
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_URL, checkHealth, createPlan, reroutePlan } from "./src/api";
import {
  isGeofencingActive,
  startGeofenceMonitoring,
  stopGeofenceMonitoring,
} from "./src/geofence";
import { PlanResponse } from "./src/types";

const STORAGE_KEY = "current_trip";
const DEFAULT_PROMPT =
  "Plan a Hue day trip from 08:00 with culture and food, budget 1200000, 5 stops";

export default function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [trip, setTrip] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "ok" | "error"
  >("checking");
  const [backendMessage, setBackendMessage] = useState(
    "Checking backend connectivity...",
  );
  const [geofenceActive, setGeofenceActive] = useState(false);

  // Dùng ref để polling trạng thái geofence mà không gây re-render loop
  const geofencePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        setTrip(JSON.parse(raw) as PlanResponse);
      }
    });
    void runHealthCheck();

    // Kiểm tra xem geofencing có đang chạy từ session trước không
    void isGeofencingActive().then(setGeofenceActive);

    return () => {
      if (geofencePollRef.current) clearInterval(geofencePollRef.current);
    };
  }, []);

  /** Poll trạng thái geofence mỗi 10s để UI luôn chính xác */
  function startGeofencePoll() {
    if (geofencePollRef.current) clearInterval(geofencePollRef.current);
    geofencePollRef.current = setInterval(() => {
      void isGeofencingActive().then(setGeofenceActive);
    }, 10_000);
  }

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
        nextError instanceof Error
          ? nextError.message
          : "Unable to reach backend health endpoint.",
      );
    }
  }

  async function persistTrip(nextTrip: PlanResponse) {
    setTrip(nextTrip);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrip));
  }

  async function handleCreatePlan() {
    setLoading(true);
    setError(null);
    try {
      await runHealthCheck();

      // Dừng geofencing cũ (nếu có) trước khi tạo plan mới
      await stopGeofenceMonitoring();
      setGeofenceActive(false);

      const nextTrip = await createPlan({ prompt });
      await persistTrip(nextTrip);

      // Task 2: Cắm geofence cho tất cả stop trong lộ trình mới
      if (nextTrip.itinerary.length > 0) {
        try {
          await startGeofenceMonitoring(nextTrip.itinerary);
          setGeofenceActive(true);
          startGeofencePoll();
        } catch (geoError) {
          // Geofence thất bại không nên block UI — hiển thị warning
          const msg =
            geoError instanceof Error
              ? geoError.message
              : "Geofence setup failed";
          setError(
            `⚠️ Lộ trình đã tạo nhưng auto-reroute không khả dụng: ${msg}`,
          );
        }
      }
    } catch (nextError) {
      const detail =
        nextError instanceof Error
          ? nextError.message
          : "Unable to create plan.";
      setError(`API ${API_URL}: ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleReroute(kind: "delayed" | "rain") {
    if (!trip) return;
    setLoading(true);
    setError(null);
    try {
      await runHealthCheck();
      const nextTrip = await reroutePlan({
        tripId: trip.trip_id,
        kind,
        minutesLate: kind === "delayed" ? 30 : 0,
      });
      await persistTrip(nextTrip);

      // Cắm lại geofence cho lộ trình mới sau khi re-route
      if (nextTrip.itinerary.length > 0) {
        await startGeofenceMonitoring(nextTrip.itinerary);
        setGeofenceActive(true);
      }
    } catch (nextError) {
      const detail =
        nextError instanceof Error ? nextError.message : "Unable to reroute.";
      setError(`API ${API_URL}: ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  // ─── Geofence Status Card component ────────────────────────────────────────

  function GeofenceSensorCard() {
    return (
      <View style={styles.sensorCard}>
        <View style={styles.sensorRow}>
          <View
            style={[
              styles.sensorDot,
              geofenceActive ? styles.sensorDotActive : styles.sensorDotOff,
            ]}
          />
          <Text style={styles.sensorLabel}>
            {geofenceActive
              ? `Geofence sensor · ${trip?.itinerary.length ?? 0} điểm đang canh gác`
              : "Geofence sensor · Chưa kích hoạt"}
          </Text>
        </View>
        {geofenceActive && (
          <Text style={styles.sensorSub}>
            OS đang theo dõi vị trí · Bán kính 500m · Màn hình có thể tắt
          </Text>
        )}
        {!geofenceActive && trip && (
          <Text style={styles.sensorSub}>
            Tạo hoặc re-route lộ trình để bật tự động tracking
          </Text>
        )}
      </View>
    );
  }

  // ─── Map Card: thay thế placeholder cũ ────────────────────────────────────
  //
  // Hiện tại hiển thị tọa độ + thông tin stop đầu tiên dạng text card.
  // Team sẽ thay bằng map SDK thực (react-native-maps / MapLibre) ở sprint sau.
  // Geofence circle rendering sẽ được overlay lên đây.

  function MapCard() {
    if (!trip?.itinerary[0]) {
      return <Text style={styles.emptyText}>No route yet.</Text>;
    }

    const firstStop = trip.itinerary[0];
    const allCoords = trip.itinerary
      .map((s) => `${s.lat.toFixed(4)},${s.lon.toFixed(4)}`)
      .join(" → ");

    return (
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapHeadline}>{firstStop.name}</Text>
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>
              Điểm 1/{trip.itinerary.length}
            </Text>
          </View>
        </View>

        <Text style={styles.mapCoord}>
          📍 {firstStop.lat.toFixed(5)}, {firstStop.lon.toFixed(5)}
        </Text>
        <Text style={styles.mapCoord}>
          🕐 {firstStop.arrival_time} → {firstStop.departure_time}
        </Text>

        {geofenceActive && (
          <View style={styles.mapGeofenceInfo}>
            <Text style={styles.mapGeofenceText}>
              ⬤ Geofence 500m đang hoạt động tại tất cả {trip.itinerary.length}{" "}
              điểm
            </Text>
          </View>
        )}

        <Text style={styles.mapAllCoords} numberOfLines={2}>
          {allCoords}
        </Text>

        <Text style={styles.mapHint}>
          Map SDK (react-native-maps) sẽ được thêm ở sprint tiếp theo. Geofence
          circles sẽ được vẽ overlay tại đây.
        </Text>
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>AI itinerary control room</Text>
        <Text style={styles.title}>Hue dynamic planner</Text>
        <Text style={styles.subtitle}>
          Prompt → structured constraints → optimized timeline → auto reroute.
        </Text>

        {/* Geofence sensor status — hiển thị ngay đầu để team test dễ */}
        <GeofenceSensorCard />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip brief</Text>
          <Text style={styles.noteText}>API endpoint: {API_URL}</Text>
          <View style={styles.healthRow}>
            <Text
              style={[
                styles.healthStatus,
                backendStatus === "ok"
                  ? styles.healthOk
                  : backendStatus === "error"
                    ? styles.healthError
                    : styles.healthChecking,
              ]}
            >
              {backendStatus === "ok"
                ? "Backend connected"
                : backendStatus === "error"
                  ? "Backend unreachable"
                  : "Checking backend"}
            </Text>
            <Pressable
              style={styles.healthButton}
              onPress={runHealthCheck}
              disabled={loading}
            >
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
          <Pressable
            style={styles.primaryButton}
            onPress={handleCreatePlan}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>Generate plan</Text>
          </Pressable>
        </View>

        {/* Nút thủ công — fallback khi geofence không khả dụng hoặc để test nhanh */}
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
          <MapCard />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {trip?.itinerary.length ? (
            trip.itinerary.map((stop) => (
              <View key={stop.poi_id} style={styles.timelineItem}>
                <View style={styles.timelineBadge}>
                  <Text style={styles.timelineBadgeText}>
                    {stop.arrival_time}
                  </Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{stop.name}</Text>
                  <Text style={styles.timelineMeta}>
                    Depart {stop.departure_time} · Travel {stop.travel_minutes}{" "}
                    min · Visit {stop.visit_minutes} min
                  </Text>
                  <Text style={styles.timelineMeta}>
                    {stop.tags.join(", ")} ·{" "}
                    {stop.outdoor ? "Outdoor" : "Indoor"} · {stop.ticket_price}{" "}
                    VND
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Generate a plan to see the itinerary timeline.
            </Text>
          )}
        </View>

        {trip ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Diagnostics</Text>
            <Text style={styles.noteText}>
              Engine: {trip.engine_used} · Fallback level: {trip.fallback_level}
            </Text>
            <Text style={styles.noteText}>
              Candidate count: {trip.diagnostics.candidate_count} · Matrix:{" "}
              {trip.diagnostics.matrix_source}
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
    backgroundColor: "#f7f1e3",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  eyebrow: {
    color: "#8c2f39",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 32,
    color: "#1d1d1d",
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    color: "#4f4f4f",
    lineHeight: 22,
  },
  // ─── Sensor card ──────────────────────────────────────────────────────────
  sensorCard: {
    backgroundColor: "#fffaf2",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ecdcc0",
    gap: 4,
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sensorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sensorDotActive: {
    backgroundColor: "#1f5c4d",
  },
  sensorDotOff: {
    backgroundColor: "#c4c4c4",
  },
  sensorLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#262626",
  },
  sensorSub: {
    fontSize: 12,
    color: "#6b6b6b",
    paddingLeft: 18,
    lineHeight: 18,
  },
  // ─── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#fffaf2",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#ecdcc0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#262626",
  },
  input: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8c9aa",
    padding: 14,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  healthRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButton: {
    backgroundColor: "#8c2f39",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#1f5c4d",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  alertButton: {
    flex: 1,
    backgroundColor: "#c44900",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: "#b00020",
    fontWeight: "600",
  },
  // ─── Map card ─────────────────────────────────────────────────────────────
  mapCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#efe3cb",
    gap: 8,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapHeadline: {
    fontSize: 16,
    fontWeight: "700",
    color: "#47311b",
    flex: 1,
  },
  mapBadge: {
    backgroundColor: "#d4b483",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#47311b",
  },
  mapCoord: {
    color: "#5a3c1b",
    fontSize: 13,
    lineHeight: 20,
  },
  mapGeofenceInfo: {
    backgroundColor: "#d4edda",
    borderRadius: 8,
    padding: 8,
  },
  mapGeofenceText: {
    fontSize: 12,
    color: "#155724",
    fontWeight: "600",
  },
  mapAllCoords: {
    color: "#8a6040",
    fontSize: 11,
    lineHeight: 16,
  },
  mapHint: {
    color: "#a08060",
    fontSize: 11,
    fontStyle: "italic",
    lineHeight: 16,
  },
  // ─── Timeline ─────────────────────────────────────────────────────────────
  emptyText: {
    color: "#6b6b6b",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
  },
  timelineBadge: {
    minWidth: 68,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ead5b5",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineBadgeText: {
    color: "#5a3c1b",
    fontWeight: "700",
  },
  timelineContent: {
    flex: 1,
    gap: 4,
  },
  timelineTitle: {
    fontSize: 16,
    color: "#1d1d1d",
    fontWeight: "700",
  },
  timelineMeta: {
    color: "#555",
    lineHeight: 20,
  },
  noteText: {
    color: "#494949",
    lineHeight: 20,
  },
  healthStatus: {
    fontWeight: "700",
  },
  healthOk: {
    color: "#1f5c4d",
  },
  healthError: {
    color: "#b00020",
  },
  healthChecking: {
    color: "#8c2f39",
  },
  healthButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8c9aa",
    backgroundColor: "#fff",
  },
  healthButtonText: {
    color: "#47311b",
    fontWeight: "700",
  },
});
