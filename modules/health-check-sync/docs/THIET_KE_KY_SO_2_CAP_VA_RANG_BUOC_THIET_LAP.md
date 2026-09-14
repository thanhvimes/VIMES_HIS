# TÀI LIỆU THIẾT KẾ VÀ TRIỂN KHAI KIẾN TRÚC KÝ SỐ 2 CẤP ĐỘ KSK LIÊN THÔNG VNEID / BỘ Y TẾ

**Ngày ban hành:** 14/09/2026  
**Phân hệ:** Khám sức khỏe liên thông VNeID & Cổng tiếp nhận dữ liệu Bộ Y tế (`health-check-sync`)  
**Cơ sở kiểm soát:** Bắt buộc tuân thủ tham số thiết lập `allow_unsigned_sync` (*"Cho phép liên thông khi chưa ký số"*).

---

## 1. Mục tiêu và Nguyên tắc Kiểm soát

### 1.1 Mục tiêu
1. Đáp ứng quy định bắt buộc của Cổng tiếp nhận dữ liệu Bộ Y tế / VNeID về chữ ký số trên file XML:
   - **Cấp độ 1 (Cá nhân):** Chữ ký số của Bác sĩ kết luận lâm sàng (`<CKS_NGUOI_KET_LUAN>`).
   - **Cấp độ 2 (Tổ chức):** Chữ ký số của Cơ sở y tế (`<CKS_BENH_VIEN>` hoặc XML-DSig Enveloped/Enveloping Signature).
2. Tự động hóa tối đa quy trình: Bác sĩ chỉ cần thực hiện kết luận & ký số cá nhân, Backend sẽ tự động gọi HSM Server để ký số tổ chức trước khi đẩy gói tin lên cổng.

### 1.2 Nguyên tắc Kiểm soát Bắt buộc (Gating Rule)
- Toàn bộ cơ chế chặn, cảnh báo và tự động ký số **phải luôn kiểm tra tham số thiết lập `allow_unsigned_sync`**:
  - Khi **`allow_unsigned_sync = true`** (Chế độ Sandbox / Thử nghiệm):
    - Không bắt buộc Bác sĩ phải ký số mới cho duyệt kết luận.
    - Không chặn gửi cổng khi hồ sơ chưa có chữ ký số.
    - Cho phép đẩy XML nguyên bản lên cổng thử nghiệm để kiểm tra mapping dữ liệu.
  - Khi **`allow_unsigned_sync = false`** (Chế độ Production / Đẩy cổng thật):
    - Bắt buộc Bác sĩ phải hoàn thành ký số kết luận trước khi hồ sơ đủ điều kiện gửi cổng.
    - Backend tự động kích hoạt HSM Server để ký số tổ chức. Nếu HSM lỗi hoặc hồ sơ thiếu chữ ký Bác sĩ, hệ thống chặn gửi ngay và thông báo lỗi rõ ràng.

---

## 2. Bảng Đối chiếu Hành vi Chi tiết

| Chức năng | Sandbox (`allow_unsigned_sync = true`) | Production (`allow_unsigned_sync = false`) |
| :--- | :--- | :--- |
| **Tab Kết luận (Bác sĩ)** | Badge: *Sandbox: Ký số tùy chọn*.<br>Cho phép Duyệt kết luận mà không cần ký. | Badge: *Bắt buộc ký số Bác sĩ*.<br>Bắt buộc bấm "Ký số Bác sĩ" trước khi Duyệt. |
| **Lưu trữ CSDL (`conclusion_data`)** | `signature` và `doctor_signature` có thể rỗng. | Lưu Base64 chữ ký Bác sĩ, thời điểm ký và thông tin Bác sĩ kết luận. |
| **Thẻ `<CKS_NGUOI_KET_LUAN>`** | Cho phép để rỗng (`<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>`). | Bắt buộc phải có chuỗi Base64 chữ ký số của Bác sĩ. |
| **Gửi cổng (`sendDocumentsToPortal`)** | Gửi thẳng gói tin không bắt buộc ký số tổ chức. | Kiểm tra: 1) Có CKS Bác sĩ chưa? -> 2) Tự động gọi HSM ký đơn vị. |
| **Ký số Tổ chức (Backend Auto-Sign)** | Bỏ qua bước gọi HSM nếu chưa có tài khoản. | Tự động gọi `signXmlViaHisHsm` với cấu hình trong `health_check_settings`. |
| **Tự động đồng bộ ngầm (`syncUnsentDocuments`)** | Quét toàn bộ hồ sơ chưa gửi (`Unsent`). | Quét hồ sơ đã ký hoặc hồ sơ đã có kết luận lâm sàng để tự động ký HSM và gửi. |

---

## 3. Các Thành phần Mã nguồn Đã Nâng cấp

### 3.1 Backend:
1. **`backend/src/services/health-check-sync-validation.ts`:**
   - Mở rộng hàm `validateDocumentBeforeSync`: Hỗ trợ tùy chọn `auto_hsm` và `has_doctor_sig`, kiểm soát chặt chẽ theo cờ `allow_unsigned_sync`.
2. **`backend/src/services/health-check-sync.service.ts`:**
   - Hàm `sendDocumentsToPortal`: Bổ sung kiểm tra Tier 1 (chữ ký Bác sĩ kết luận) và Tier 2 (tự động kích hoạt HSM Server ký đơn vị `signXmlViaHisHsm`).
   - Tự động cập nhật `signature_status = 'Signed'`, `signature_type = 'HSM'`, và `signature` vào bảng `health_check_masters`.
   - Hàm `syncUnsentDocuments`: Tối ưu hóa bộ lọc `signatureFilter` cho phép background worker tự động lấy các hồ sơ đã kết luận để kích hoạt HSM ký số và đẩy cổng.

### 3.2 Frontend:
1. **`modules/health-check-sync/hooks/useDynamicFormState.ts` & `useChildFormState.ts`:**
   - Đảm bảo lưu đầy đủ `signature`, `doctor_signature`, `doctor_name`, `signed_at` vào khối `conclusionData` của `health_check_details`.
2. **`modules/health-check-sync/forms/tabs/ConclusionTab.tsx` & `ChildConclusionTab.tsx`:**
   - Nạp trạng thái `allow_unsigned_sync` từ cài đặt hệ thống.
   - Thêm nút **"Ký số Bác sĩ"** và hiển thị huy hiệu trạng thái chữ ký Bác sĩ trực quan.
   - Ràng buộc: Khi `allow_unsigned_sync === false`, không cho phép Duyệt nếu chưa ký số Bác sĩ.
3. **`modules/health-check-sync/views/HealthCheckSyncView.tsx`:**
   - Cập nhật kiểm tra trước khi gửi cổng: Phân biệt rõ giữa ký số USB Token và ký số tự động HSM, tôn trọng tuyệt đối giá trị của `allowUnsignedSync`.

---

## 4. Hướng dẫn Kiểm tra và Nghiệm thu

1. **Kiểm tra Chế độ Sandbox (BẬT toggle):**
   - Vào Cấu hình chung -> Bật *"Cho phép liên thông khi chưa ký số"*.
   - Vào hồ sơ KSK -> Tab Kết luận -> Bấm "Duyệt" -> Hệ thống cho phép duyệt bình thường.
   - Ra màn hình Quản lý liên thông -> Bấm "Gửi" -> Hồ sơ gửi thành công lên Sandbox mà không bị chặn.
2. **Kiểm tra Chế độ Production (TẮT toggle):**
   - Vào Cấu hình chung -> Tắt *"Cho phép liên thông khi chưa ký số"*.
   - Vào hồ sơ KSK -> Tab Kết luận -> Bấm "Duyệt" -> Hệ thống cảnh báo yêu cầu "Ký số Bác sĩ".
   - Bấm "Ký số Bác sĩ" -> Chữ ký được sinh và nhúng thành công -> Bấm "Duyệt" -> Thành công.
   - Khi bấm gửi cổng -> Backend tự động gọi HSM ký số tổ chức -> Hồ sơ chuyển sang `Signed` và gửi lên cổng với đầy đủ 2 cấp độ chữ ký.
