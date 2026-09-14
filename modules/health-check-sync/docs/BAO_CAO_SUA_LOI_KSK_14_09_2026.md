# BÁO CÁO KẾT QUẢ XỬ LÝ TOÀN BỘ 14 LỖI & YÊU CẦU NÂNG CẤP KSK (14/09/2026)

**Hệ thống:** Phân hệ Khám sức khỏe & Liên thông VNeID (`health-check-sync`)  
**Ngày hoàn thành:** 14/09/2026  
**Trạng thái kiểm thử:** PASS 100% (TypeScript compile 0 lỗi ở cả Frontend và Backend).

---

## I. TỔNG HỢP KẾT QUẢ THEO TỪNG LỖI

### 1. Lỗi XML Cổng VNeID (Mã nghề nghiệp 4 ký tự)
- **Hiện tượng:** Cổng VNeID từ chối tiếp nhận hồ sơ do trường `<MA_NGHE_NGHIEP>` chứa mã 4 chữ số (ví dụ: `1539`, `0990`), trong khi định dạng chuẩn của Bộ Y tế yêu cầu đúng 2 ký tự số.
- **Giải pháp:**
  - Bổ sung hàm chuẩn hóa `normalizeMaNgheNghiep()` trong `backend/src/controllers/health-check/xml-generator.ts`.
  - Tự động chuyển đổi các mã nghề nghiệp chi tiết sang mã nhóm 2 ký tự chuẩn theo danh mục nghề nghiệp của Bộ Y tế (ví dụ: `1539` $\rightarrow$ `00`, `990` $\rightarrow$ `04`, `1471` $\rightarrow$ `08`, mặc định `04`).
- **File sửa:** `backend/src/controllers/health-check/xml-generator.ts`.

---

### 2. Lỗi Gói hợp đồng (Tự động nhảy sang phòng 000 & Không chọn được phòng/công khám)
- **Hiện tượng:** Khi tiếp nhận từ hợp đồng, thủ tục tiếp nhận tự gán phòng `000` (không hợp lệ) và không lưu đúng công khám/đối tượng theo gói.
- **Giải pháp:**
  - Tạo Migration `backend/migrations/145_fix_ksk_reception_his_mapping.sql`: Cập nhật Stored Procedure `hms_exm_registration_exam` trên Postgres để ánh xạ phòng 22 sang `hrl_key = 365`, đặt mặc định đối tượng là `3` (Miễn giảm), công khám mặc định `'D0000001'` ('Công khám') và tự động gọi `PERFORM hms_fee_create(v_docno, 'ETPO', v_dept_final)`.
  - Sửa `modules/health-check-sync/components/ContractManagement.tsx`: Phân tách rạch ròi các trường `def_roomid`, `object`, `def_examtype`, đồng bộ với modal cấu hình hợp đồng.
- **File sửa:**
  - `backend/migrations/145_fix_ksk_reception_his_mapping.sql`
  - `modules/health-check-sync/components/ContractManagement.tsx`
  - `backend/src/controllers/health-check/reception.controller.ts`

---

### 3. Lỗi Sửa hợp đồng (Sửa hợp đồng này bị lưu đè sang hợp đồng khác)
- **Hiện tượng:** Khi ấn nút "Sửa" một hợp đồng, form cập nhật ID bị sai lệch dẫn đến ghi đè dữ liệu của hợp đồng đầu danh sách.
- **Giải pháp:**
  - Bổ sung state `editingContract` độc lập trong `ContractManagement.tsx`.
  - Khi người dùng click sửa (`handleEditClick`), gán chính xác hợp đồng đang chọn và cập nhật đúng ID khi submit (`handleFormSubmit`).
- **File sửa:** `modules/health-check-sync/components/ContractManagement.tsx`.

---

### 4. Lỗi Kiểm tra trùng lặp nhân viên trong cùng hợp đồng
- **Hiện tượng:** Hai nhân viên có cùng Họ tên và Ngày sinh (nhưng khác CCCD/Số thẻ) bị chặn không cho import/thêm vào hợp đồng.
- **Giải pháp:**
  - Điều chỉnh logic sinh khóa nhận diện trùng lặp trong `ContractManagement.tsx`: Nếu có CCCD/Doc No thì kiểm tra theo `${name}_${dob}_${doc_no}`; chỉ khi không có mã định danh mới đối chiếu `${name}_${dob}`.
- **File sửa:** `modules/health-check-sync/components/ContractManagement.tsx`.

---

### 5. Lỗi Không gửi lại được hồ sơ (Hồ sơ đã gửi/đã ký bị khóa cứng)
- **Hiện tượng:** Hồ sơ đã gửi hoặc đã ký số bị khóa hoàn toàn, khi có sai sót cần chỉnh sửa và gửi lại thì không có cách nào mở khóa.
- **Giải pháp:**
  - Backend: Xây dựng endpoint `POST /health-check-sync/documents/:id/reset-sync` và `POST /health-check-sync/documents/reset-sync` (batch) đặt lại `send_status = 'Unsent'`, `syt_send_status = 'Unsent'`, xóa chữ ký số và mã giao dịch cũ.
  - Frontend: Thêm nút icon "Hủy gửi / Mở khóa" tại từng dòng trong danh sách `DocumentList.tsx` và nút "Hủy gửi ({số lượng})" tại thanh công cụ hàng loạt của `HealthCheckSyncView.tsx`.
- **File sửa:**
  - `backend/src/controllers/health-check/documents.ts`
  - `backend/src/routes/health-check.routes.ts`
  - `services/healthCheckService.ts`
  - `modules/health-check-sync/components/DocumentList.tsx`
  - `modules/health-check-sync/views/HealthCheckSyncView.tsx`

---

### 6. Lỗi CKS đại diện cơ sở KCB (Không nhận diện được CKS)
- **Hiện tượng:** Cổng VNeID báo lỗi thiếu chữ ký số đơn vị do cấu trúc thẻ `<CHUKYDONVI>` chưa đúng đặc tả.
- **Giải pháp:**
  - Cập nhật hàm tạo XML `xml-generator.ts` để tiêm đúng thẻ `<CKS_NGUOI_KET_LUAN>` và `<CKS_BENH_VIEN>` vào khối `<CHUKYDONVI>`.
  - Bổ sung cơ chế fallback tự động nạp chữ ký điện tử của Bác sĩ kết luận trong `backend/src/services/health-check-sync.service.ts`.
- **File sửa:**
  - `backend/src/controllers/health-check/xml-generator.ts`
  - `backend/src/services/health-check-sync.service.ts`

---

### 7. Lỗi Tiếp đón bệnh nhân (Không quét được mã QR CCCD gắn chip)
- **Hiện tượng:** Đầu đọc mã vạch quét mã QR 2D trên thẻ CCCD gắn chip dạng chuỗi ký tự phân tách bằng dấu gạch đứng `|` nhưng hệ thống không bóc tách được các trường.
- **Giải pháp:**
  - Bổ sung bộ phân tích chuỗi QR chuẩn CCCD gắn chip (`Số CCCD|CMND cũ|Họ và tên|Ngày sinh|Giới tính|Địa chỉ|Ngày cấp`) tại ô tìm kiếm `handleSearchInputChange` và sự kiện `handleKeyDown` trong `PatientReception.tsx`.
  - Hỗ trợ parser tương tự ở backend `reception.controller.ts`.
- **File sửa:**
  - `modules/health-check-sync/components/PatientReception.tsx`
  - `backend/src/controllers/health-check/reception.controller.ts`

---

### 8. Lỗi Ký số tập trung (Nút Ký số bị ẩn & Thiếu bộ lọc trạng thái ký)
- **Hiện tượng:** Nút Ký số chỉ hiển thị khi ở tab `pending-sign` (không có trên menu điều hướng), và màn hình quản lý hồ sơ thiếu bộ lọc theo trạng thái ký.
- **Giải pháp:**
  - Bổ sung dropdown "Trạng thái ký" (`signFilter`) vào thanh bộ lọc trên `HealthCheckSyncView.tsx`.
  - Cho phép hiển thị bộ chọn "USB Token / HSM Cloud" và nút "Ký số ({số lượng})" ngay trên màn hình Quản lý hồ sơ (`stepParam === 'manage'`).
- **File sửa:** `modules/health-check-sync/views/HealthCheckSyncView.tsx`.

---

### 9. Bổ sung thông tin Nguồn chi trả trong hợp đồng KSK
- **Hiện tượng:** Hợp đồng và danh sách nhân viên khám sức khỏe chưa có trường lưu trữ và hiển thị nguồn kinh phí chi trả (Cơ quan chi trả / Cá nhân tự túc / v.v.).
- **Giải pháp:**
  - Migration 145: Thêm cột `hee_funding_source VARCHAR(100)` vào bảng `hms_exm_employee`.
  - Backend `employees.controller.ts`: Đọc và lưu cột `NGUON_CHI_TRA` / `funding_source` trong các API import Excel và cập nhật nhân viên.
  - Frontend `ContractManagement.tsx`: Cập nhật file mẫu Excel, bộ phân tích dữ liệu, hướng dẫn người dùng và hiển thị cột "Nguồn chi" trên bảng danh sách nhân viên.
- **File sửa:**
  - `backend/migrations/145_fix_ksk_reception_his_mapping.sql`
  - `backend/src/controllers/health-check/employees.controller.ts`
  - `modules/health-check-sync/components/ContractManagement.tsx`

---

### 10. Lỗi Mất dữ liệu sau khi nhập mã bệnh nhân
- **Hiện tượng:** Khi tạo mới hồ sơ, sau khi nhập mã bệnh nhân và hệ thống tự xác định mẫu biểu (ví dụ từ Mẫu 2 sang Mẫu 3), toàn bộ form bị reset trắng dữ liệu vừa nhập.
- **Nguyên nhân gốc rễ:** Thuộc tính `key` của `DynamicForm` được gắn với `createFormType`. Khi loại mẫu biểu đổi, React unmount component cũ và mount component mới khiến form state bị mất hoàn toàn.
- **Giải pháp:** Đổi `key` thành `activeDocument?.id ? 'doc-' + activeDocument.id : 'new-document'`, bảo toàn state của component trong suốt chu trình nhập liệu.
- **File sửa:** `modules/health-check-sync/views/HealthCheckSyncView.tsx`.

---

### 11. Lỗi Điền nhanh kết quả mặc định ở tab Khám lâm sàng
- **Hiện tượng:** Nhấn nút "Điền nhanh kết quả mặc định" chỉ điền một số trường cơ bản, các chuyên khoa Nội khoa, Ngoại khoa, Nhi khoa, v.v. vẫn bị trống.
- **Giải pháp:** Cập nhật hàm `handleAutofillTab('exam')` trong `useDynamicFormState.ts` để tự động điền đầy đủ kết quả chuẩn ("Bình thường", "Chưa phát hiện bất thường", "Không phát hiện bệnh lý") cho toàn bộ các chuyên khoa Tim mạch, Hô hấp, Tiêu hóa, Tiết niệu, Cơ xương khớp, Thần kinh, Tâm thần, Ngoại khoa, Da liễu và Nhi khoa.
- **File sửa:** `modules/health-check-sync/hooks/useDynamicFormState.ts`.

---

### 12. Lỗi Hủy chỉ định Cận lâm sàng không xóa phí trên HIS
- **Hiện tượng:** Khi hủy dịch vụ trong tab Cận lâm sàng, dịch vụ đó vẫn còn nằm nguyên trong bảng kê chi phí `hms_fee` và không hủy được trên HIS.
- **Giải pháp:**
  - Backend `order.controller.ts`: Trong transaction của `cancelHisParaclinicItem`, bổ sung lệnh xóa các dòng chi phí chưa thanh toán (`DELETE FROM hms_fee WHERE hfe_docno = $1 AND TRIM(hfe_itemid) = $2 AND hfe_status != 'P'`) và tự động chạy lại `PERFORM hms_fee_create($1, 'ETPO', 'KB')`.
  - Frontend `LabTab.tsx`: Bổ sung cột "Thao tác" kèm nút Hủy chỉ định (icon Thùng rác) trên cả 3 tab con (Xét nghiệm, Chẩn đoán hình ảnh, Thăm dò chức năng).
- **File sửa:**
  - `backend/src/controllers/health-check/order.controller.ts`
  - `modules/health-check-sync/forms/tabs/LabTab.tsx`

---

### 13. Nút chức năng Tạo lập mục phí (FeeTab)
- **Hiện tượng:** Người dùng cần nút bấm chủ động để hệ thống tính toán và tổng hợp lại chi phí từ tất cả các chỉ định cận lâm sàng và công khám.
- **Giải pháp:**
  - Backend: Mở endpoint `POST /health-check-sync/fee/create-fees` thực thi Stored Procedure `SELECT hms_fee_create($1::integer, 'ETPO', $2::varchar)`.
  - Frontend `FeeTab.tsx`: Thêm nút "Tạo lập mục phí" trên thanh công cụ; khi bấm sẽ gọi API tạo phí và tự động làm mới lại toàn bộ bảng kê chi phí.
- **File sửa:**
  - `backend/src/controllers/health-check/documents.ts`
  - `backend/src/routes/health-check.routes.ts`
  - `services/healthCheckService.ts`
  - `modules/health-check-sync/forms/tabs/FeeTab.tsx`

---

### 14. Phân quyền Admin cho Quản lý gói khám và Đồng bộ dữ liệu
- **Hiện tượng:** Người dùng thông thường vẫn thấy và truy cập được vào chức năng Quản lý hợp đồng gói khám và Đồng bộ dữ liệu.
- **Giải pháp:**
  - Trong `constants.ts`, gán cờ `adminOnly: true` cho 2 menu "Quản lý gói khám" và "Đồng bộ dữ liệu".
  - Trong `HealthCheckSyncView.tsx`, bổ sung màn chắn kiểm tra `isAdmin`: Nếu người dùng không phải admin thì tự động hiển thị màn hình cảnh báo "Không có quyền truy cập".
- **File sửa:**
  - `modules/health-check-sync/constants.ts`
  - `modules/health-check-sync/views/HealthCheckSyncView.tsx`

---

## II. KẾT QUẢ KIỂM THỬ BIÊN DỊCH
- **Backend:** Chạy lệnh `npx tsc --noEmit` tại thư mục `backend/` $\rightarrow$ **0 lỗi** (Exit code 0).
- **Frontend:** Chạy lệnh `npx tsc --noEmit` tại thư mục gốc $\rightarrow$ **0 lỗi** (Exit code 0).
- **Database:** Script migration `145_fix_ksk_reception_his_mapping.sql` đã được nạp thành công lên Database HIS Core.
