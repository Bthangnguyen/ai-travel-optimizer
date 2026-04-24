# Báo cáo Kiểm thử — AI Itinerary Optimizer (Hue Dynamic Planner)

**Ngày kiểm thử:** 24/04/2026  
**Người kiểm thử:** Lê Văn Quốc  
**Branch:** `feature/deploy-and-test-apk`  
**Build profile:** `development-device` (EAS Cloud Build)  
**Thiết bị:** Android (điện thoại thật, kết nối WiFi LAN)  
**Backend:** FastAPI + uvicorn, chạy local tại `http://192.168.1.5:8000`

---

## 1. Kết quả Triển khai (Deployment)

| Hạng mục                 | Kết quả       |
| ------------------------ | ------------- |
| EAS Cloud Build          | ✅ Thành công |
| Cài APK lên thiết bị     | ✅ Thành công |
| Kết nối backend qua WiFi | ✅ Thành công |
| Bản đồ hiển thị          | ✅ Thành công |
| AI generate plan         | ✅ Thành công |

---

## 2. Kiểm thử Edge Case

### TC-01 — Prompt rỗng

- **Mô tả:** Xóa hết nội dung ô input, bấm "Generate plan"
- **Kết quả:** App báo lỗi
- **Đánh giá:** ✅ PASS — Xử lý đúng

---

### TC-02 — Prompt không hợp lệ (linh tinh)

- **Mô tả:** Nhập chuỗi vô nghĩa (ví dụ: "asdfghjkl"), bấm "Generate plan"
- **Kết quả:** App xoay loading vài vòng rồi giữ nguyên plan cũ, không có thông báo lỗi rõ ràng
- **Đánh giá:** ⚠️ PARTIAL — App không crash nhưng thiếu thông báo lỗi cho người dùng

---

### TC-03 — Budget = 0

- **Mô tả:** Nhập prompt với budget = 0 VND
- **Kết quả:** App vẫn đề xuất các địa điểm có giá tiền bình thường, không có địa điểm nào hiển thị 0 VND
- **Đánh giá:** ⚠️ FAIL — Backend không validate budget = 0, kết quả trả về không phản ánh constraint

---

### TC-04 — Số điểm dừng = 0

- **Mô tả:** Nhập prompt với stops = 0
- **Kết quả:** App chỉ hiển thị 1 điểm dừng thay vì báo lỗi hoặc trả về danh sách rỗng
- **Đánh giá:** ⚠️ FAIL — Kết quả không đúng kỳ vọng, thiếu validation

---

### TC-05 — Không có nút Reset Plan

- **Mô tả:** Sau khi generate plan, không tìm thấy chức năng reset/xóa plan hiện tại
- **Kết quả:** Tính năng không tồn tại trong UI
- **Đánh giá:** ❌ MISSING FEATURE — Người dùng không thể xóa plan để bắt đầu lại từ đầu

---

### TC-06 — Bấm "I'm delayed" khi chưa có plan

- **Mô tả:** Bấm nút "I'm delayed" trước khi generate plan
- **Kết quả:** Hoạt động đúng (không crash, xử lý graceful)
- **Đánh giá:** ✅ PASS

---

### TC-07 — Bấm "It's raining" khi chưa có plan

- **Mô tả:** Bấm nút "It's raining" trước khi generate plan
- **Kết quả:** Hiển thị "reroute trigger: rain" nhưng không rõ có thực sự reroute không
- **Đánh giá:** ⚠️ PARTIAL — Trigger được ghi nhận nhưng hành vi chưa rõ ràng với người dùng

---

### TC-08 — Bấm "I'm delayed" / "It's raining" sau khi có plan

- **Mô tả:** Generate plan trước, sau đó bấm các nút reroute
- **Kết quả:** Hoạt động đúng, plan được điều chỉnh
- **Đánh giá:** ✅ PASS

---

## 3. Tổng kết

| Kết quả              | Số lượng |
| -------------------- | -------- |
| ✅ PASS              | 3        |
| ⚠️ PARTIAL / WARNING | 3        |
| ❌ FAIL / MISSING    | 2        |
| **Tổng**             | **8**    |

---

## 4. Các vấn đề cần xử lý (Issues)

| Mức độ    | Vấn đề                                  | Đề xuất                                                  |
| --------- | --------------------------------------- | -------------------------------------------------------- |
| 🔴 High   | Thiếu nút Reset Plan                    | Thêm nút "New trip" hoặc "Reset" vào UI                  |
| 🟡 Medium | Không validate budget = 0               | Backend cần trả lỗi khi budget <= 0                      |
| 🟡 Medium | Không validate stops = 0                | Backend cần trả lỗi khi stops <= 0                       |
| 🟡 Medium | Prompt linh tinh không có thông báo lỗi | Hiển thị toast/alert khi backend không parse được prompt |
| 🟡 Medium | "It's raining" trigger không rõ hành vi | Cần thêm feedback rõ ràng sau khi trigger reroute        |

---

## 5. Môi trường kiểm thử

```
OS máy tính:     Windows 11
Node:            v24.14.1
Expo CLI:        55.0.26
EAS CLI:         18.8.1
Python:          3.14.3
Backend:         FastAPI + uvicorn
AI Engine:       ortools (Fallback level: 0)
Routing Matrix:  geometric-fallback
```
