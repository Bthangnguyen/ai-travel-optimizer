/**
 * geofence.ts — Dev 7: Map & Geo Layer
 *
 * Nhiệm vụ:
 *   1. Cắm geofence 500m quanh từng điểm dừng trong lộ trình (Task 2)
 *   2. Khi OS báo EXIT, so sánh giờ thực tế vs giờ dự kiến (Task 3)
 *   3. Áp dụng Dwell Time ≥ 2 phút trước khi bắn /reroute (Task 4 — vá GAP GPS Drift)
 *
 * Lưu ý kiến trúc:
 *   - Module này chỉ chạy trên Native Build (không hoạt động trên Expo Go)
 *   - Geofencing được OS quản lý hoàn toàn → tiết kiệm pin, không tự ping GPS
 *   - Toàn bộ state lộ trình được đọc từ AsyncStorage (Dev 5 đã lưu vào đây)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { rerouteGeofence } from "./api";
import { ItineraryStop, PlanResponse } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Tên task background — phải unique trong toàn app */
const GEOFENCE_TASK = "GEOFENCE_TRAVEL_MONITOR";

/** Bán kính vòng tròn ảo (mét). 500m = đủ rộng để OS phát hiện, đủ nhỏ để tránh false positive */
const GEOFENCE_RADIUS_METERS = 500;

/** Dwell Time: phải ở ngoài vùng liên tục bao nhiêu ms trước khi kích hoạt re-route.
 *  Vá GAP #2 (RISK_MANAGEMENT): chặn GPS drift bắn false trigger.
 *  2 phút = đủ để phân biệt "rời đi thật sự" vs "GPS nhảy nhót nhất thời" */
const DWELL_TIME_MS = 2 * 60 * 1000; // 2 phút

/** Key lưu trip hiện tại trong AsyncStorage (đồng bộ với App.tsx) */
const STORAGE_KEY_TRIP = "current_trip";
const STORAGE_KEY_DEVICE_TOKEN = "device_token";

// ─── Dwell Time State (in-memory, reset khi app restart) ──────────────────────
//
// Lưu ý: state này sẽ reset nếu OS kill app rồi wake up lại.
// Đây là acceptable trade-off cho MVP — xác suất OS kill trong đúng 2 phút dwell rất thấp.

/** Map: geofence_identifier → timeout handle để có thể cancel nếu user quay lại */
const dwellTimeoutHandles = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Helper: parse giờ "HH:MM" → số phút từ 00:00 ────────────────────────────

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Trả về giờ hiện tại dạng "HH:MM" */
function nowAsTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// ─── Task 3: Logic tính delay và bắn reroute ─────────────────────────────────

/**
 * Được gọi sau khi Dwell Time đã xác nhận (user thực sự rời đi).
 * So sánh giờ thực tế vs giờ dự kiến → bắn /reroute nếu trễ.
 */
async function handleConfirmedExit(
  stop: ItineraryStop,
  trip: PlanResponse,
): Promise<void> {
  const actualTimeStr = nowAsTimeString();
  const actualMinutes = parseTimeToMinutes(actualTimeStr);
  const scheduledMinutes = parseTimeToMinutes(stop.departure_time);

  const minutesLate = actualMinutes - scheduledMinutes;

  console.log(
    `[Geofence] EXIT confirmed tại ${stop.name}. ` +
      `Dự kiến rời: ${stop.departure_time}, Thực tế: ${actualTimeStr}, ` +
      `Trễ: ${minutesLate} phút`,
  );

  // Nếu không trễ (hoặc sớm hơn lịch) → không cần re-route
  if (minutesLate <= 0) {
    console.log("[Geofence] Đúng giờ hoặc sớm hơn lịch — không cần re-route.");
    return;
  }

  // Xác định các POI đã visit (tất cả stop trước stop hiện tại trong itinerary)
  const currentIndex = trip.itinerary.findIndex(
    (s) => s.poi_id === stop.poi_id,
  );
  const visitedPoiIds = trip.itinerary
    .slice(0, currentIndex + 1)
    .map((s) => s.poi_id);

  console.log(`[Geofence] Trễ ${minutesLate} phút → Bắn POST /reroute`);

  try {
    // Task 3: Đóng gói JSON theo contracts/reroute-request.schema.json
    // trigger.kind = "geofence" (phân biệt với "delayed" thủ công của nút cũ)
    const deviceToken = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_TOKEN);
    if (!deviceToken) {
      console.warn("[Geofence] Missing device token, skip reroute.");
      return;
    }
    await rerouteGeofence({
      tripId: trip.trip_id,
      deviceToken,
      minutesLate,
      visitedPoiIds,
      currentTime: actualTimeStr,
    });
    console.log("[Geofence] Re-route thành công.");
  } catch (err) {
    console.error("[Geofence] Lỗi khi gọi /reroute:", err);
    // Không throw — background task không được crash
  }
}

// ─── Task 4: Dwell Time logic ─────────────────────────────────────────────────

/**
 * Bắt đầu đếm Dwell Time khi nhận EXIT event.
 * Nếu sau DWELL_TIME_MS mà không có ENTER event (user quay lại),
 * mới coi là "EXIT thật sự" và gọi handleConfirmedExit.
 */
function startDwellTimer(
  identifier: string,
  stop: ItineraryStop,
  trip: PlanResponse,
): void {
  // Nếu đã có timer đang chạy cho stop này → bỏ qua (idempotent)
  if (dwellTimeoutHandles.has(identifier)) {
    return;
  }

  console.log(
    `[Geofence] Bắt đầu Dwell Timer ${DWELL_TIME_MS / 1000}s cho ${stop.name}`,
  );

  const handle = setTimeout(() => {
    dwellTimeoutHandles.delete(identifier);
    void handleConfirmedExit(stop, trip);
  }, DWELL_TIME_MS);

  dwellTimeoutHandles.set(identifier, handle);
}

/**
 * Hủy Dwell Timer khi nhận ENTER event.
 * Xảy ra khi GPS drift đẩy user ra ngoài rồi kéo lại — hoặc user thực sự quay lại.
 */
function cancelDwellTimer(identifier: string, stopName: string): void {
  const handle = dwellTimeoutHandles.get(identifier);
  if (handle) {
    clearTimeout(handle);
    dwellTimeoutHandles.delete(identifier);
    console.log(
      `[Geofence] Dwell Timer hủy cho ${stopName} — user quay lại vùng.`,
    );
  }
}

// ─── Task Manager: Background Task Definition ─────────────────────────────────
//
// Định nghĩa task này phải ở module-level (ngoài component),
// vì TaskManager cần đăng ký trước khi Expo app mount.

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[Geofence Task] Lỗi từ OS:", error.message);
    return;
  }

  if (!data) return;

  // expo-location trả về data dạng { eventType, region }
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  // Đọc trip state từ AsyncStorage (Dev 5 đã persist vào đây)
  const raw = await AsyncStorage.getItem(STORAGE_KEY_TRIP);
  if (!raw) {
    console.warn("[Geofence Task] Không có trip trong storage.");
    return;
  }

  let trip: PlanResponse;
  try {
    trip = JSON.parse(raw) as PlanResponse;
  } catch (parseError) {
    console.error("[Geofence Task] Invalid trip payload in storage:", parseError);
    await AsyncStorage.removeItem(STORAGE_KEY_TRIP);
    return;
  }
  const identifier = region.identifier;
  if (!identifier) {
    console.warn("[Geofence Task] Missing geofence identifier.");
    return;
  }

  // Tìm stop tương ứng với geofence identifier (dùng poi_id làm identifier)
  const stop = trip.itinerary.find((s) => s.poi_id === identifier);
  if (!stop) {
    console.warn(
      `[Geofence Task] Không tìm thấy stop cho identifier: ${identifier}`,
    );
    return;
  }

  if (eventType === Location.GeofencingEventType.Exit) {
    // Task 4: Không bắn ngay — bắt đầu đếm Dwell Time
    startDwellTimer(identifier, stop, trip);
  } else if (eventType === Location.GeofencingEventType.Enter) {
    // User quay lại vùng (hoặc GPS drift vào lại) → hủy timer
    cancelDwellTimer(identifier, stop.name);
  }
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Task 2: Cắm geofence 500m cho tất cả các stop trong lộ trình.
 *
 * Gọi hàm này ngay sau khi createPlan() trả về thành công.
 * OS sẽ tự theo dõi — app không cần làm gì thêm, kể cả khi màn hình tắt.
 *
 * @param itinerary - Mảng điểm dừng từ PlanResponse
 */
export async function startGeofenceMonitoring(
  itinerary: ItineraryStop[],
): Promise<void> {
  // Dừng session geofencing cũ (nếu có) trước khi cắm mới
  await stopGeofenceMonitoring();

  // Kiểm tra và xin quyền "Always Allow" — bắt buộc cho background tracking
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== "granted") {
    throw new Error(
      "Cần quyền vị trí để theo dõi lộ trình. Vui lòng cấp quyền trong Cài đặt.",
    );
  }

  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== "granted") {
    throw new Error(
      "Cần quyền 'Luôn cho phép' để tự động cập nhật lộ trình khi màn hình tắt. " +
        "Vào Cài đặt → Ứng dụng → AI Itinerary → Vị trí → Luôn cho phép.",
    );
  }

  // Tạo danh sách GeofencingRegion từ itinerary
  // Dùng poi_id làm identifier để match lại trong background task
  const regions: Location.LocationRegion[] = itinerary.map((stop) => ({
    identifier: stop.poi_id,
    latitude: stop.lat,
    longitude: stop.lon,
    radius: GEOFENCE_RADIUS_METERS,
    notifyOnEnter: true, // Cần để hủy Dwell Timer khi GPS drift vào lại
    notifyOnExit: true, // Event chính để phát hiện user rời đi
  }));

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);

  console.log(
    `[Geofence] Đã cắm ${regions.length} vùng geofence 500m. ` +
      `OS đang canh gác — app có thể sleep.`,
  );
}

/**
 * Dừng toàn bộ geofencing và hủy tất cả Dwell Timer đang chạy.
 * Gọi khi user kết thúc chuyến đi hoặc tạo lộ trình mới.
 */
export async function stopGeofenceMonitoring(): Promise<void> {
  // Hủy tất cả dwell timers đang pending
  dwellTimeoutHandles.forEach((handle) => clearTimeout(handle));
  dwellTimeoutHandles.clear();

  // Dừng background task nếu đang chạy
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
  if (isRegistered) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
    console.log("[Geofence] Đã dừng geofence monitoring.");
  }
}

/**
 * Kiểm tra geofencing có đang chạy không.
 * Dùng để hiển thị trạng thái sensor trong UI.
 */
export async function isGeofencingActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
}
