# KẾ HOẠCH TRIỂN KHAI CẤU HÌNH & LIÊN THÔNG ĐA CỔNG (BỘ Y TẾ & SỞ Y TẾ) CHO MODULE KHÁM SỨC KHỎE

Hệ thống VIMES_HIS hiện đã có tính năng liên thông dữ liệu KSK lên Cổng Bộ Y tế / VNeID theo QĐ 2062/QĐ-BYT.
Yêu cầu mới:
1. Thiết lập thêm cấu hình gửi cổng Sở Y tế (SYT - cụ thể là Hệ thống HSSKĐT Hà Nội theo Công văn 7286/SYT-QLBHYTCNTT).
2. Đáp ứng linh hoạt:
   - Một số đơn vị cần gửi **CẢ 2 CỔNG** (vừa Bộ Y tế vừa Sở Y tế).
   - Một số đơn vị chỉ gửi **1 CỔNG BỘ Y TẾ**.
   - (Và hỗ trợ đơn vị chỉ gửi 1 Cổng Sở Y tế nếu cần).
3. **BẢO ĐẢM TUYỆT ĐỐI**: Không làm thay đổi hay gián đoạn việc gửi dữ liệu hiện tại của các đơn vị đang vận hành ổn định.

---

## 1. Phân tích Kỹ thuật & Thiết kế Tối ưu

### 1.1. Chế độ đồng bộ (`sync_target_mode`)
Trong bảng `health_check_settings`, bổ sung trường `sync_target_mode` gồm 3 giá trị:
* `BYT_ONLY` *(Mặc định)*: Chỉ gửi Cổng Bộ Y tế (VNeID/EMRHub) $\rightarrow$ Giữ nguyên 100% luồng cũ.
* `BOTH`: Gửi song song cả 2 cổng. Hồ sơ sẽ lần lượt được gửi tới Cổng BYT và Cổng SYT.
* `SYT_ONLY`: Chỉ gửi Cổng Sở Y tế Hà Nội.

### 1.2. Độc lập trạng thái gửi (Fault Isolation)
Khi một đơn vị chọn chế độ `BOTH`, trạng thái gửi cần được quản lý độc lập trên bảng `health_check_masters`:
* Nhánh BYT: Dùng các cột hiện tại (`send_status`, `sent_at`, `transaction_id`, `response_log`, `error_message`).
* Nhánh SYT: Bổ sung các cột chuyên biệt:
  - `syt_send_status`: `Unsent` | `Sent` | `Error`
  - `syt_sent_at`: Thời gian gửi thành công lên SYT
  - `syt_transaction_id`: Lưu `maGiaoDich` do SYT cấp để đối soát trên portal `https://hssk.hanoi.gov.vn`
  - `syt_error_message`: Thông báo lỗi từ cổng SYT (nếu có)
  - `syt_response_log`: Chi tiết phản hồi API SYT

**Cơ chế chống gửi trùng (Smart Retry):**
Nếu gửi `BOTH` mà cổng BYT thành công nhưng cổng SYT lỗi (hoặc ngược lại), khi người dùng bấm "Gửi lại", hệ thống chỉ gửi tiếp cho cổng bị lỗi, **tuyệt đối không gửi lặp lại cổng đã thành công**.

### 1.3. Tối ưu Payload & CPU
* Cả 2 cổng đều dùng **100% chuẩn XML phong bì `<KHAMSUCKHOE>` theo QĐ 2062/QĐ-BYT**.
* XML sau khi ký số (bác sĩ kết luận + viện) được tái sử dụng nguyên vẹn cho cả 2 cổng.
* Header gói tin JSON:
  - BYT: `receiver_id = settings.vneid_receiver_id` (`TTYQG` hoặc `emrhub`).
  - SYT: `receiver_id = settings.syt_receiver_id` (`VTS`).
  - Cả hai đều dùng cặp Private Key của đơn vị để tạo `signature` SHA256withRSA.

---

## 2. Các tệp tin mã nguồn cần can thiệp

### 2.1. Database Migration
Tạo migration an toàn `backend/migrations/078_add_syt_gateway_config_and_status.sql`:
- Bổ sung các cột vào `health_check_settings`:
  - `sync_target_mode VARCHAR(20) DEFAULT 'BYT_ONLY'`
  - `syt_url VARCHAR(255) DEFAULT 'https://api-hssk.hanoi.gov.vn'`
  - `syt_username VARCHAR(100)`
  - `syt_password TEXT`
  - `syt_receiver_id VARCHAR(50) DEFAULT 'VTS'`
  - `syt_enabled BOOLEAN DEFAULT FALSE`
- Bổ sung các cột vào `health_check_masters`:
  - `syt_send_status VARCHAR(20) DEFAULT 'Unsent'`
  - `syt_sent_at TIMESTAMP`
  - `syt_transaction_id VARCHAR(100)`
  - `syt_error_message VARCHAR(500)`
  - `syt_response_log TEXT`
- Tạo index hỗ trợ tìm kiếm: `idx_hc_masters_syt_status` trên `syt_send_status`.

### 2.2. Backend Core
- [health-check-settings.ts](file:///d:/AI/VIMES_HIS/backend/src/config/health-check-settings.ts): Bổ sung kiểu dữ liệu và giải mã password SYT.
- [contracts.controller.ts](file:///d:/AI/VIMES_HIS/backend/src/controllers/health-check/contracts.controller.ts): Bổ sung cập nhật settings và hàm `testSytConnection`.
- [health-check.routes.ts](file:///d:/AI/VIMES_HIS/backend/src/routes/health-check.routes.ts): Thêm endpoint test kết nối SYT.
- [health-check-sync.service.ts](file:///d:/AI/VIMES_HIS/backend/src/services/health-check-sync.service.ts): Tích hợp adapter đẩy SYT và điều phối chế độ `BYT_ONLY`, `BOTH`, `SYT_ONLY`.

### 2.3. Frontend UI
- [HealthCheckSettings.ts](file:///d:/AI/VIMES_HIS/modules/health-check-sync/models/HealthCheckSettings.ts): Thêm fields vào model settings.
- [GeneralConfigTab.tsx](file:///d:/AI/VIMES_HIS/modules/health-check-sync/components/settings/GeneralConfigTab.tsx): Thêm UI radio chọn chế độ và form cấu hình cổng SYT.
- [SettingsTab.tsx](file:///d:/AI/VIMES_HIS/modules/health-check-sync/components/SettingsTab.tsx): Kết nối state và xử lý test connection SYT.
- [healthCheckService.ts](file:///d:/AI/VIMES_HIS/services/healthCheckService.ts): Thêm API client method test SYT.
- [HealthCheckSyncView.tsx](file:///d:/AI/VIMES_HIS/modules/health-check-sync/views/HealthCheckSyncView.tsx): Hiển thị badge trạng thái 2 cổng.
