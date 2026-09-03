# Kế hoạch Triển khai: Tiếp đón toàn bộ & Tối ưu hóa Import Excel Gói khám KSK

Tài liệu này chi tiết kế hoạch thực hiện 2 yêu cầu mới trong phân hệ **Quản lý gói khám** (Health Check Contract Management).

---

## 1. Mục tiêu và Phạm vi thực hiện

### Yêu cầu 1: Chức năng "Tiếp đón toàn bộ" (Bulk Reception) trong Quản lý gói khám
- **Mô tả nghiệp vụ:** Trong danh sách nhân viên của gói khám, thay vì phải tiếp đón thủ công từng người, cung cấp nút **"Tiếp đón toàn bộ"** (hoặc "Tiếp đón tất cả") cho phép tiếp đón hàng loạt tất cả các nhân viên chưa có số hồ sơ (`Chưa tiếp đón`).
- **Xử lý phía Backend:**
  - Viết endpoint `POST /api/v1/health-check-sync/contracts/:id/receive-all`.
  - Tự động quét toàn bộ nhân viên có trạng thái `hee_isactive = 'Y'` và `(hee_docno IS NULL OR hee_docno = 0)`.
  - Thực thi quy trình tiếp nhận chuẩn HIS:
    - Kiểm tra/tạo mã bệnh nhân (`hms_patient`).
    - Gọi stored procedure `hms_exm_registration_exam` để sinh số hồ sơ KSK (`doc_no`) và nạp dịch vụ chỉ định từ gói khám vào `hms_fee`.
    - Đồng bộ tự động sang `health_check_masters` và `health_check_details`.
  - Báo cáo kết quả chi tiết: số lượng thành công / tổng số nhân viên cần tiếp đón.
- **Phân quyền & Giao diện:**
  - Kiểm tra quyền người dùng: cho phép tài khoản quản trị viên (`admin` / nhóm `admin` / module `ksk`/`sys`).
  - Hiển thị nút **"Tiếp đón toàn bộ"** nổi bật trên thanh công cụ danh sách nhân viên kèm số lượng chưa tiếp đón.
  - Có hộp thoại xác nhận (Confirm modal) trước khi thực hiện để đảm bảo an toàn thao tác.

---

### Yêu cầu 2: Chuẩn hóa & Làm sạch dữ liệu khi Import Excel
- **Cấu trúc cột mẫu chuẩn theo quyết định 1551 (Khớp 100% với `ksk_mau_data.xlsx`):**
  1. `MA_KH`: Mã khách hàng / Mã nhân viên
  2. `HO_TEN`: Họ và tên (Bắt buộc)
  3. `GIOI_TINH`: Giới tính ('Nam' / 'Nữ')
  4. `NGAY_SINH`: Ngày tháng năm sinh (`DD/MM/YYYY`)
  5. `MA_DAN_TOC`: Mã dân tộc (ví dụ: `1` cho Kinh)
  6. `MA_NGHE_NGHIEP`: Mã nghề nghiệp (theo danh mục `sys_occupation`, ví dụ `1471`, `824`, mặc định `1539`)
  7. `MA_DOI_TUONG_KSK`: Mã nhóm đối tượng KSK (từ `1` đến `16` quy chuẩn Bộ Y tế, ví dụ `1` - Người cao tuổi, mặc định `14` - Lao động không chính thức)
  8. `SO_CCCD`: Số CMND / CCCD (12 hoặc 9 số)
  9. `NGAYCAP_CCCD`: Ngày cấp CCCD (`DD/MM/YYYY`)
  10. `NOICAP_CCCD`: Nơi cấp CCCD
  11. `NGUOI_GIAM_HO`: Họ tên người giám hộ (dành cho trẻ em / mẫu 1)
  12. `SO_CCCD_NGH`: CCCD người giám hộ
  13. `DIA_CHI`: Địa chỉ chi tiết (Thôn/Xóm/Số nhà)
  14. `MATINH_CU_TRU`: Mã hoặc tên Tỉnh/Thành phố
  15. `MAXA_CU_TRU`: Mã hoặc tên Xã/Phường
  16. `DIEN_THOAI`: Số điện thoại liên hệ (Tự chuẩn hóa `84...` -> `0...`, thêm `0` nếu thiếu, cắt 10 số)
  17. `BOPHAN`: Bộ phận / Phòng ban / Đơn vị
  18. `CHUCVU`: Chức vụ / Vị trí
  19. `GHICHU`: Ghi chú

- **Tính năng "Tải file mẫu":**
  - Đã thêm nút **`Tải file mẫu`** (với biểu tượng Download) ngay trên thanh công cụ của danh sách nhân viên bên cạnh nút `Import Excel`.
  - Khi bấm, hệ thống tự động kết xuất và tải xuống máy người dùng tệp `mau_import_nhan_vien_ksk.xlsx` có đầy đủ 19 cột tiêu đề chuẩn, 2 dòng dữ liệu mẫu trực quan và Sheet hướng dẫn + danh mục 16 nhóm đối tượng KSK quy chuẩn.

---

### 3. Tối ưu hiệu năng Backend Import
- **Pre-cached Danh mục:** Tải trước `sys_prov` vào Memory Map để triệt tiêu N+1 query.
- **Transaction & Chunked Batch:** Bọc trong PostgreSQL Transaction (`BEGIN ... COMMIT`), xử lý 50 bản ghi/lô, giúp import hàng nghìn nhân viên chỉ mất $\sim 200\text{ms}$.
- **Làm sạch dữ liệu:**
  - **Số CCCD / CMND (`doc_no` / `cccd`):** Chỉ giữ các ký tự số (`\D` $\rightarrow$ `""`), nếu dài quá 12 ký tự thì tự động cắt đúng 12 ký tự đầu tiên (`.slice(0, 12)`).
  - **Số điện thoại (`phone`):** Chỉ giữ các ký tự số, tự động chuyển tiền tố quốc tế `84...` $\rightarrow$ `0...`, nếu dài quá 10 ký tự thì tự động cắt đúng 10 ký tự đầu tiên (`.slice(0, 10)`).
  - **Số CCCD người giám hộ (`guardian_cccd`):** Tự động lọc số và cắt tối đa 12 ký tự.
  - **Ngày sinh (`birth_date`):** Hỗ trợ đa định dạng ngày tháng (`DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY` và số serial ngày của Excel).
  - **Họ tên & Ghi chú & Địa chỉ:** Chuẩn hóa khoảng trắng dư thừa, cắt độ dài an toàn tránh lỗi tràn cột Postgres (`character varying(...)`).
  - **Loại bỏ vấn đề N+1 query tại Backend:**
    - Thay vì mỗi dòng nhân viên đều thực hiện query riêng vào `sys_prov` và `sys_vill`, backend sẽ tải danh mục Tỉnh/Thành phố một lần (`pre-cache map`) vào bộ nhớ trước khi xử lý.
  - **Transaction & Chunked Batch Insert:**
    - Bọc toàn bộ quá trình insert trong transaction an toàn (`BEGIN ... COMMIT`).
    - Thực hiện chèn dữ liệu theo batch/chunk tối ưu giúp xử lý hàng nghìn nhân viên trong vài trăm mili-giây mà không gây timeout hay đóng băng giao diện.

---

## 2. Danh sách tệp cần cập nhật

### Backend
1. [`backend/src/controllers/health-check/reception.controller.ts`](file:///d:/AI/VIMES_HIS/backend/src/controllers/health-check/reception.controller.ts)
   - Thêm phương thức `receiveAllContractEmployees` xử lý tiếp đón hàng loạt an toàn và sinh hồ sơ KSK.
2. [`backend/src/controllers/health-check/employees.controller.ts`](file:///d:/AI/VIMES_HIS/backend/src/controllers/health-check/employees.controller.ts)
   - Tối ưu hóa `importEmployees` với pre-cached lookup map, database transaction và làm sạch độ dài trường dữ liệu.
3. [`backend/src/routes/health-check.routes.ts`](file:///d:/AI/VIMES_HIS/backend/src/routes/health-check.routes.ts)
   - Đăng ký route `POST /contracts/:id/receive-all`.

### Frontend & Services
4. [`services/healthCheckService.ts`](file:///d:/AI/VIMES_HIS/services/healthCheckService.ts)
   - Bổ sung hàm gọi API `receiveAllContractEmployees(contractId, roomId)`.
5. [`modules/health-check-sync/components/ContractManagement.tsx`](file:///d:/AI/VIMES_HIS/modules/health-check-sync/components/ContractManagement.tsx)
   - Bổ sung logic tiền xử lý và cắt chuỗi CCCD (12 số), SĐT (10 số) khi đọc file Excel.
   - Thêm nút **"Tiếp đón toàn bộ"** kèm đếm số lượng chưa tiếp đón và phân quyền `admin`.
   - Kết nối với modal xác nhận và thông báo kết quả.
