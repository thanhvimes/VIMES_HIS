# 🔬 TÀI LIỆU THIẾT KẾ & KẾ HOẠCH CHUYỂN ĐỔI PHÂN HỆ XÉT NGHIỆM (LIS)
> **Nguồn chuyển đổi:** Hệ thống C++ MFC `D:\DEV\VIMESManageClinic\VIMESLaboratoryMangr`  
> **Đích đến:** Hệ thống Web vClinic (React + Vite + Node.js + PostgreSQL `vimes_130`)

---

## 1. 🔍 Phân Tích Hệ Thống Cũ (Legacy Source Code Analysis)

### A. Các Màn Hình & Chức Năng Chính Trong C++:
1. **`CLIMSPatientList` (`LIMSPatientList.cpp / .h`):**
   - Quản lý danh sách bệnh nhân chờ thực hiện / đã có kết quả.
   - 4 Trạng thái xử lý:
     - `m_wndWaiting` (`O` / `Waiting`): Bệnh nhân vừa được Bác sĩ chỉ định, chờ lấy mẫu & tiếp nhận.
     - `m_wndRunning` (`R` / `Running`): Đã lấy mẫu, duyệt mẫu, đang chạy xét nghiệm trên máy hoặc thủ công.
     - `m_wndPerformed` (`P` / `Performed`): Đã có kết quả xét nghiệm (nhập tay hoặc máy đẩy về), chờ Bác sĩ KTV duyệt.
     - `m_wndConfirmed` (`T`, `U` / `Confirmed`): Bác sĩ / Trưởng khoa đã ký duyệt và trả kết quả chính thức.
   - Lọc nhanh theo Khoa phòng (`sys_dept`), Nhóm xét nghiệm (`hms_feegroup` mã `B1100`, `B1200`...), Ngày chỉ định, Mã hồ sơ (`docno`), Tên BN.
   - Nhận diện ca cấp cứu (`hd_emergency = 'Y'`) hiển thị màu đỏ cảnh báo.

2. **`CLIMSPatientProfile` (`LIMSPatientProfile.cpp / .h`):**
   - Màn hình trung tâm hiển thị toàn bộ chỉ định và kết quả xét nghiệm của bệnh nhân.
   - Bảng kết quả chỉ số chi tiết (`hms_testorderln` + `hms_test_result`):
     - Mã chỉ số & Tên chỉ số con (Sub-item / Test Item).
     - Kết quả đo (Result Value).
     - Đơn vị tính (`g/L`, `mmol/L`, `10^9/L`, `mg/dL`...).
     - Dải tham chiếu bình thường (Min Value - Max Value hoặc Chuỗi bình thường).
     - Cờ cảnh báo: **H** (High - Cao vượt ngưỡng), **L** (Low - Thấp dưới ngưỡng), **Panic** (Nguy kịch).
     - Máy thực hiện (Analyzer / Instrument), KTV thực hiện, Bác sĩ duyệt.

3. **`CHMSTestEntryDialog` & `CHMSTestApprovalDialog`:**
   - Hỗ trợ KTV nhập nhanh kết quả bằng bàn phím (ấn phím mũi tên / Enter tự động nhảy dòng).
   - Tác vụ Duyệt kết quả hàng loạt hoặc theo từng dịch vụ.

4. **`DeviceInterface.cpp` / `ASTMProtocolDialog.cpp` / `CommPort.cpp`:**
   - Kết nối máy xét nghiệm 2 chiều qua giao thức ASTM 1381/1394 và HL7 v2.x (cổng COM RS-232 hoặc mạng LAN TCP/IP).
   - Ghép kết quả tự động theo mã vạch Barcode ống nghiệm (Sample ID).

---

## 2. 🗄️ Cấu Trúc Bảng Cơ Sở Dữ Liệu (`vimes_130`):

| Bảng Cơ Sở Dữ Liệu | Vai Trò & Chức Năng |
| :--- | :--- |
| **`hms_testorder` / `pcms_order`** | Phiếu chỉ định xét nghiệm (Mã phiếu `orderid`, `docno`, `patientno`, Ngày chỉ định, Bác sĩ chỉ định, Khoa phòng, Trạng thái `hto_status`). |
| **`hms_testorderln` / `pcms_order_line`** | Chi tiết các dịch vụ xét nghiệm trong phiếu (Mã DV `testid`, Số lượng, Đơn giá, Trạng thái từng dịch vụ). |
| **`hms_test_result`** | Kết quả chi tiết từng chỉ số xét nghiệm (`orderid`, `subitem_id`, `result_value`, `unit`, `min_val`, `max_val`, `warning_flag`, `instrument_id`, `technician`, `approved_by`). |
| **`hms_fee_subitem`** | Danh mục chỉ số con đã chuẩn hóa ở Module Admin (Mã chỉ số, Tên chỉ số, Đơn vị, Dải tham chiếu Nam/Nữ/Trẻ em). |

---

## 3. 🚀 Kiến Trúc Phân Hệ Xét Nghiệm Mới Trên Web vClinic:

### A. Backend Architecture (`backend/src/`):
- **`src/controllers/lab/lab.controller.ts`:**
  - `getWorklist(req, res)`: Tra cứu danh sách hàng đợi mẫu theo 4 trạng thái (Chờ tiếp nhận ➔ Đang chạy ➔ Chờ duyệt ➔ Đã duyệt).
  - `getOrderDetails(req, res)`: Lấy thông tin BN, danh sách DVKT và các chỉ số con cần nhập kết quả.
  - `acceptSample(req, res)`: Tiếp nhận / Duyệt mẫu xét nghiệm, đổi trạng thái sang `R` (Running).
  - `saveResults(req, res)`: Lưu kết quả xét nghiệm, tự động so sánh dải tham chiếu để gắn cờ `H`/`L`/`NORMAL`.
  - `approveResults(req, res)`: Ký duyệt kết quả xét nghiệm, tự động ghi `system_log` (Module `LAB`, Event `LAB_APPROVE`).
  - `unapproveResults(req, res)`: Hủy duyệt kết quả khi cần chỉnh sửa lại.
  - `printResultSheet(req, res)`: Trích xuất dữ liệu in phiếu kết quả xét nghiệm chuẩn mẫu Bộ Y tế.
- **`src/services/lab.service.ts`:**
  - Logic tính toán cờ cảnh báo tự động dựa trên độ tuổi, giới tính của bệnh nhân và dải tham chiếu của từng chỉ số.
- **`src/routes/lab.routes.ts`:**
  - Khai báo các endpoints `/api/v1/lab/*` kèm middleware phân quyền `LAB_VIEW`, `LAB_ENTRY`, `LAB_APPROVE`.

### B. Frontend Architecture (`modules/lab-results/`):
- **1. Màn hình Hàng Đợi & Tiếp Nhận Mẫu (`LabReceptionView.tsx`):**
  - Thanh Tabs trực quan 4 trạng thái: `Chờ tiếp nhận (Waiting)`, `Đang xét nghiệm (Running)`, `Chờ duyệt (Performed)`, `Đã duyệt (Confirmed)`.
  - Bộ lọc: Khoa chỉ định (dùng `Combobox.tsx`), Nhóm xét nghiệm (Huyết học, Hóa sinh, Nước tiểu, Miễn dịch...), Ngày chỉ định, Tìm kiếm nhanh theo Tên BN/Mã HS/Barcode.
  - Highlight nổi bật các ca Cấp cứu (Badge Đỏ nhấp nháy).
- **2. Màn hình Nhập & Duyệt Kết Quả Chuyên Nghiệp (`LabProcessingView.tsx`):**
  - Layout 2 cột tối ưu:
    - **Cột trái (30%):** Danh sách bệnh nhân trong hàng đợi, click chọn để nạp nhanh hồ sơ.
    - **Cột phải (70%):** Bảng nhập kết quả theo từng gói xét nghiệm.
  - Các tính năng UX đỉnh cao:
    - Nhập bàn phím siêu tốc: Nhấn `Enter` hoặc `Mũi tên xuống` để tự động chuyển sang ô tiếp theo.
    - Tự động highlight màu: Giá trị cao (**H - Đỏ đậm**), Giá trị thấp (**L - Xanh dương**), Nguy kịch (**Panic - Nền đỏ chữ trắng**).
    - Nút tác vụ nhanh: `Tiếp nhận mẫu`, `Lưu nháp`, `Duyệt kết quả (F9)`, `Hủy duyệt`, `In kết quả (Ctrl+P)`.
- **3. Trung Tâm Kết Nối Máy Xét Nghiệm LIS (`LabConnectionView.tsx`):**
  - Giám sát luồng dữ liệu thời gian thực từ các máy xét nghiệm tự động (ASTM/HL7).
  - Tự động nhận diện Barcode ống nghiệm để map kết quả vào bệnh nhân mà không cần gõ tay.
- **4. Mẫu In Phiếu Kết Quả Xét Nghiệm Chuẩn Bộ Y Tế:**
  - Thiết kế phiếu in A4/A5 sắc nét, có logo bệnh viện, mã QR tra cứu kết quả trực tuyến, đầy đủ chữ ký KTV và Bác sĩ Trưởng khoa.
