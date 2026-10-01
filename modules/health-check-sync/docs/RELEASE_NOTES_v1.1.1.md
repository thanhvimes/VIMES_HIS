# VIMES HIS - PHÂN HỆ KHÁM SỨC KHỎE (KSK)
## TÀI LIỆU PHÁT HÀNH PHIÊN BẢN v1.1.1
*Ngày phát hành: 23/09/2026*

---

### 1. TỔNG QUAN PHIÊN BẢN v1.1.1
Phiên bản **v1.1.1** tập trung nâng cấp toàn diện chất lượng, độ an toàn chuyên môn và trải nghiệm người dùng cho Phân hệ Khám Sức Khỏe (KSK) và tích hợp HIS Core:
1. Hệ thống đối chiếu chéo lâm sàng (Clinical Cross-Check) và cảnh báo mềm thông minh.
2. Tái cấu trúc phân rã các modal khổng lồ thành sub-modals độc lập (Code-Splitting).
3. Thanh tiến trình thời gian thực (Task Progress Modal) cho tất cả các tác vụ xử lý hàng loạt.
4. Chuẩn hóa truy vấn cơ sở dữ liệu `vimes_nb` theo đúng cấu trúc thực tế và cơ chế Safe Pushback bảo vệ dữ liệu phòng khám khác.

---

### 2. CHI TIẾT CÁC NÂNG CẤP NỔI BẬT

#### 2.1. Đối Chiếu Lâm Sàng & Cảnh Báo Mềm (Clinical Cross-Check & Soft Warning)
* **Quy chuẩn đối chiếu:**
  * **Huyết áp:** HA tâm thu $\ge 160$ hoặc tâm trương $\ge 100$ mmHg $\rightarrow$ Cảnh báo nếu bác sĩ xếp Loại I hoặc II.
  * **BMI:** $\ge 30$ hoặc $< 16$ $\rightarrow$ Cảnh báo nếu xếp Loại I hoặc II.
  * **Mạch:** $\ge 120$ hoặc $< 50$ bpm $\rightarrow$ Cảnh báo nếu xếp Loại I.
  * **Chuyên khoa lẻ:** Tự động đối chiếu nếu chuyên khoa lẻ (Mắt, TMH, RHM...) xếp Loại III/IV/V nhưng kết luận chung lại xếp loại tốt hơn.
* **Cơ chế Soft-Warning:** Hiển thị hộp cảnh báo màu vàng cam trên `ConclusionTab.tsx`, không chặn cứng, trao toàn quyền quyết định linh hoạt cho bác sĩ.

#### 2.2. Tái Cấu Trúc Sub-Modals (Code Splitting)
* Bóc tách hơn 1,550 dòng code inline thành 8 sub-modal chuyên biệt:
  * Hợp đồng (`components/contracts/modals/`): `ContractFormModal`, `ContractServicesModal`, `EmployeeEditModal`, `ContractImportHisDocsModal`, `ContractSyncClsModal`.
  * Tiếp nhận (`components/reception/modals/`): `ReceptionSlipModal`, `ReceptionEditModal`, `ReceptionAddModal`.
* Giữ nguyên 100% logic, giao diện, phím tắt và khả năng tương thích ngược.

#### 2.3. Thanh Tiến Trình Thời Gian Thực (Task Progress Modal)
* Xây dựng `TaskProgressModal.tsx` hiển thị % tiến độ, tổng số, thành công, thất bại, chỉ báo hồ sơ đang chạy tức thời và accordion danh sách lỗi chi tiết.
* Tích hợp vào:
  1. Gửi Cổng giám định hàng loạt (HealthCheckSyncView).
  2. Tiếp nhận hàng loạt nhân viên đoàn KSK (ContractManagement).
  3. Đồng bộ CLS toàn bộ hợp đồng từ HIS Core (ContractManagement).

#### 2.4. Khắc Phục Lỗi Schema Database HIS Core & Safe Pushback
* Chuẩn hóa truy vấn bảng `hms_exm_employee`: Loại bỏ cột không tồn tại `hee_target_group` và sửa lỗi ép kiểu chuỗi đối với số nguyên `hee_docno`.
* Bảo vệ nghiêm ngặt phòng khám chuyên khoa khác và bảo toàn ngày khám gốc khi đồng bộ kết luận về HIS Core (`hms_exam`, `hms_doc`).

---

### 3. THÔNG TIN GÓI CẬP NHẬT
* **Phiên bản:** `1.1.1`
* **Gói cập nhật tự động qua Web (In-App System Update):**
  * Tệp lưu trữ: `releases/vimes-his-v1.1.1.tar.gz` (5.11 MB)
  * Manifest: `releases/version.json`
  * SHA-256: `9fe2ae48f65003488aa0957b84c02c2823936baa6b8bb33ece2aef3f72a44312`
* **Thư mục cài đặt / nâng cấp trực tiếp:**
  * Đường dẫn: `release/VIMES-HIS-deploy/`
  * Hướng dẫn triển khai: `release/VIMES-HIS-deploy/DEPLOY_INSTRUCTIONS.md`
  * Script khởi chạy: `start.bat` (Windows) / `start.sh` (Linux)
* **Kiểm thử tự động:** 100% PASS (5 suites, 0 lỗi TypeScript).
