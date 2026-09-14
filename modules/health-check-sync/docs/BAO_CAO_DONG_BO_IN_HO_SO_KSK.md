# BÁO CÁO ĐỒNG BỘ DỮ LIỆU TÁC VỤ IN DANH SÁCH VÀ XEM HỒ SƠ (MODULE KSK VNeID)

**Ngày thực hiện:** 13/09/2026  
**Phân hệ:** Khám sức khỏe liên thông VNeID (`modules/health-check-sync`)  
**Tác vụ:** Đồng bộ hóa dữ liệu bản in giữa nút **[IN]** ở ngoài danh sách (`DocumentList`, `PrintCodeList`) và nút **[Xem hồ sơ]** bên trong form (`DynamicForm`).

---

## 1. Vấn đề phát hiện (Root Cause Analysis)

Khi người dùng mở một hồ sơ khám sức khỏe (ví dụ Mẫu 03 - người lớn), nhập liệu/duyệt chuyên khoa (như Sản phụ khoa) và bấm **[Xem hồ sơ]** thì bản in hiển thị đầy đủ thông tin khám, phân loại và bác sĩ ký. Tuy nhiên, khi bấm nút **[IN]** trực tiếp từ ngoài danh sách (`DocumentList` hoặc `PrintCodeList`), dữ liệu bản in hiển thị sai hoặc hiển thị "Chưa khám" / "Không khám".

### Nguyên nhân gốc rễ:
1. **Thiếu bước tải chi tiết mới nhất khi bấm [IN] từ danh sách:**
   - Trong `HealthCheckSyncView.tsx`, `onEdit` và `onViewXml` đều gọi `await healthCheckService.getDocument(doc.id)` để lấy đầy đủ chi tiết mới nhất từ server.
   - Tuy nhiên, `onPrint` ngoài danh sách chỉ truyền đối tượng `doc` thô từ state của bảng phân trang (`setActiveDocument(doc)`), có thể chứa dữ liệu cũ trước khi lưu hoặc thiếu các trường chuyên sâu.
2. **Xung đột cấu trúc dữ liệu `specialty_metadata` trong Database:**
   - Khi tiếp nhận/đồng bộ từ HIS, `d.clinical_data.specialty_metadata` (ở cấp root) được tạo với trạng thái ban đầu (`CHUA_KHAM`).
   - Khi bác sĩ nhập liệu và lưu qua `DynamicForm`, metadata chuyên khoa cập nhật được ghi vào `d.clinical_data.clinical_exam.specialty_metadata`.
   - Trong `backend/src/services/health-check-merge.service.ts` (`mergeClinicalData`), hệ thống chỉ merge vào `clinical_exam.specialty_metadata`, mà không đồng bộ ngược lại trường `specialty_metadata` ở root. Do đó, root metadata bị "đóng băng" ở trạng thái `CHUA_KHAM`.
3. **Thứ tự ưu tiên fallback trong `PrintFormMau3.tsx`, `PrintFormMau2.tsx` và `PrintForm.tsx`:**
   - Bản in lấy metadata theo thứ tự:
     ```typescript
     specialty_metadata: rawClinical.specialty_metadata || clinicalExam.specialty_metadata
     ```
   - Do `rawClinical.specialty_metadata` ở root tồn tại (là object chứa `CHUA_KHAM`), toán tử `||` lập tức lấy object cũ này và bỏ qua toàn bộ dữ liệu mới trong `clinicalExam.specialty_metadata`!
   - Trong khi đó, nút **[Xem hồ sơ]** (`handlePreview` trong `useDynamicFormState.ts`) chỉ truyền `clinical_exam.specialty_metadata` mà không có root metadata, nên nó fallback vào đúng dữ liệu mới, dẫn đến tình trạng: **Xem hồ sơ thì đúng, nhưng In ngoài danh sách thì sai.**

---

## 2. Giải pháp kỹ thuật đã triển khai

### A. Backend (`backend/src/services/health-check-merge.service.ts`)
- Cập nhật hàm `mergeClinicalData`:
  - Đồng bộ và hợp nhất `resolvedSpecialtyMetadata` vào cả hai vị trí: `merged.clinical_exam.specialty_metadata` và `merged.specialty_metadata`.
  - Đảm bảo dữ liệu lưu trong PostgreSQL luôn nhất quán ở mọi tầng truy vấn.

### B. Frontend View (`modules/health-check-sync/views/HealthCheckSyncView.tsx`)
- Xây dựng hàm chuẩn hóa dùng chung `normalizeDocumentForPrint(doc)`:
  - Đồng bộ cả 2 cặp thuộc tính camelCase và snake_case: `clinical_data` / `clinicalData`, `lab_data` / `labData`, `conclusion_data` / `conclusionData`, `patient_name` / `patientName` (in hoa chuẩn chuẩn hóa), `doc_no` / `docNo`, `form_type` / `formType`.
  - Hợp nhất thông minh `specialty_metadata` từ tất cả các nguồn (`clinicalExam`, `rawClinical`, `document`), ưu tiên các chuyên khoa đã khám (`ĐÃ_KHÁM`, `ĐÃ_DUYỆT`) và bác sĩ phụ trách.
- Xây dựng hàm `handlePrintDocument(doc)`:
  - Tự động gọi `await healthCheckService.getDocument(doc.id)` lấy dữ liệu chi tiết mới nhất từ backend.
  - Chuẩn hóa qua `normalizeDocumentForPrint`.
- Gắn `onPrint={handlePrintDocument}` cho cả `DocumentList` và `PrintCodeList`.
- Chuẩn hóa cả luồng `onPreview` trong `DynamicForm` qua cùng hàm `normalizeDocumentForPrint`.

### C. Frontend Form State (`modules/health-check-sync/hooks/useDynamicFormState.ts`)
- Đồng bộ `specialty_metadata` vào cả root `clinicalData` và `clinicalData.clinical_exam` trong cả 2 hàm:
  - `handleSave`
  - `handlePreview`

### D. Biểu mẫu in (`PrintFormMau3.tsx`, `PrintFormMau2.tsx`, `PrintForm.tsx`)
- Thay thế việc fallback đơn giản bằng thuật toán **Smart Merge Specialty Metadata**:
  - Quét qua tất cả nguồn metadata khả dĩ.
  - Chuyên khoa nào có trạng thái `ĐÃ_KHÁM`, `ĐÃ_DUYỆT` hoặc có thông tin `doctorId` / `doctorName` sẽ ghi đè trạng thái `CHUA_KHAM`.
- Cập nhật hàm kiểm tra `hasSpecialtyExamined`, `resolveSpecialtyDoctorName`, `resolveSpecialtyDoctorSignature` để luôn đọc từ metadata đã được hợp nhất thông minh.

### E. Danh sách hồ sơ (`modules/health-check-sync/components/DocumentList.tsx`)
- Thêm hàm `getResolvedSpecMeta(doc)` giúp cột trạng thái khám và nút "Gửi" luôn hiển thị đúng tiến độ khám thực tế của bệnh nhân.

---

## 3. Kết quả kiểm thử và Xác nhận

1. **Biên dịch mã nguồn (TypeScript Check):**
   - Backend: `npx tsc --noEmit` -> **0 lỗi** (Exit code 0).
   - Frontend: `npx tsc --noEmit` -> **0 lỗi** (Exit code 0).
2. **Kiểm thử trên dữ liệu thực tế (Record ID 3970 - NGUYỄN THỊ CHUNG):**
   - Dữ liệu gốc: Root metadata lưu `CHUA_KHAM` (lttuyet), trong khi inner metadata lưu `ĐÃ_DUYỆT` (admin - Lương Thị Tuyết).
   - Kết quả sau khi chạy qua thuật toán hợp nhất: Trạng thái phân giải chuẩn xác thành `ĐÃ_DUYỆT`, bác sĩ `Lương Thị Tuyết`, kết quả Sản phụ khoa hiển thị đầy đủ, không còn bị ẩn hay hiện "Chưa khám".
3. **Độ tương đồng 100%:**
   - Dữ liệu hiển thị khi click nút **[IN]** ở ngoài danh sách và nút **[Xem hồ sơ]** bên trong biểu mẫu hoàn toàn đồng nhất.
