# KẾ HOẠCH TRIỂN KHAI HỆ THỐNG QUẢN LÝ BIỂU MẪU, KÝ SỐ & LƯU TRỮ BỆNH ÁN ĐIỆN TỬ (VIMES EMR ENGINE)

> **Dự án:** Hệ thống Thông tin Bệnh viện & Bệnh án Điện tử VIMES (VIMES_HIS & EMR)  
> **Phân hệ:** Quản lý Biểu mẫu, Ký số & Lưu trữ Bệnh án Điện tử (`modules/document-engine` & `backend/src/emr-engine`)  
> **Căn cứ pháp lý:** Thông tư 46/2018/TT-BYT, Thông tư 54/2017/TT-BYT, Luật Khám bệnh Chữa bệnh 2023  
> **Trạng thái:** Sẵn sàng triển khai

---

## 📌 1. BẢNG CHECKLIST CHI TIẾT TỪNG GIAI ĐOẠN

### 🔹 GIAI ĐOẠN 1: Thiết Kế Cơ Sở Dữ Liệu & Database Migrations (Backend)
- [x] **Mục 1.1:** Tạo file migration `backend/migrations/065_create_emr_document_tables.sql` chuẩn Idempotent (`CREATE TABLE IF NOT EXISTS`).
- [x] **Mục 1.2:** Tạo bảng `emr_document_instance` (Quản lý từng tờ tài liệu lâm sàng: UUID, doc_no, patient_id, template_code, snapshot_data, raw_pdf_path, signed_pdf_path, pdf_sha256, status).
- [x] **Mục 1.3:** Tạo bảng `emr_document_signature` (Quản lý chữ ký số Bác sĩ, Trưởng khoa, Dấu viện, Chữ ký tay Bệnh nhân trên Tablet, Timestamp TSA).
- [x] **Mục 1.4:** Tạo bảng `emr_document_bundle` (Quản lý trọn bộ hồ sơ bệnh án khi xuất viện).
- [x] **Mục 1.5:** Tạo bảng `emr_document_bundle_item` (Mục lục và đánh số trang liên tục từ trang 1 đến trang N).
- [x] **Mục 1.6:** Tạo bảng `emr_document_amendment` (Lưu lịch sử đính chính / thay thế phiên bản v1 $\rightarrow$ v2 khi có sự cố).
- [x] **Mục 1.7:** Tạo bảng `emr_document_access_log` (Nhật ký kiểm toán truy cập & trích sao hồ sơ bệnh án).
- [x] **Mục 1.8:** Chạy kiểm thử migration `npm run migrate` trên PostgreSQL.

---

### 🔹 GIAI ĐOẠN 2: Xây Dựng Backend Engine & API Dịch Vụ EMR (Backend Core)
- [x] **Mục 2.1:** Viết `backend/src/emr-engine/emr-document.service.ts`:
  - `generateDocumentInstance()`: Đổ Snapshot JSON vào file Word $\rightarrow$ Render PDF/A-1b $\rightarrow$ Tính SHA-256.
  - `previewDocumentHtml()`: Render bản xem trước trực tiếp trên RAM (không lưu rác ổ cứng S3).
- [x] **Mục 2.2:** Xây dựng cơ chế **Ký số Hàng loạt (Batch Signing)**:
  - `batchSignDocuments()`: Cho phép Bác sĩ ký đồng thời 30–50 tờ chỉ với 1 lần xác thực OTP/PIN SmartCA.
- [x] **Mục 2.3:** Xây dựng cơ chế **Bệnh nhân Ký tay trên Tablet**:
  - `patientTabletSign()`: Tiếp nhận ảnh chữ ký cảm ứng $\rightarrow$ Nhúng vào vị trí cam kết trên PDF trước khi Bác sĩ ký niêm phong.
- [x] **Mục 2.4:** Xây dựng logic **Đính chính văn bản (Addendum Workflow)**:
  - `amendDocument()`: Tạo bản v2, đóng dấu Watermark "ĐÃ THAY THẾ BỞI BẢN V2" lên bản cũ v1.
- [x] **Mục 2.5:** Xây dựng cơ chế **Đóng bệnh án & Đánh số trang liên tục (Bates Numbering & Master Merging)**:
  - `closeAndBundleMedicalRecord()`: Tự động gom các tờ rời, đánh số `Trang X/Y`, sinh Tờ Mục Lục Bệnh Án và lưu file PDF Master khóa WORM.
- [x] **Mục 2.6:** Định tuyến bộ API tại `backend/src/routes/emr.routes.ts`.

---

### 🔹 GIAI ĐOẠN 3: Xây Dựng Giao Diện Lâm Sàng Cho Bác Sĩ (Frontend EMR UI)
- [x] **Mục 3.1:** Xây dựng Component **Cây Thư Mục Bệnh Án (`EmrDocumentTree.tsx`)**:
  - Phân loại rõ ràng: *Tờ bìa, Tờ điều trị theo ngày, Phiếu chăm sóc, Cận lâm sàng LIS/PACS, Giấy ra viện*.
- [x] **Mục 3.2:** Xây dựng Component **Hộp Thư Ký Số Bác Sĩ (`DoctorSigningInbox.tsx`)**:
  - Danh sách các tờ cần ký trong ca trực.
  - Nút bấm **"Tích chọn tất cả $\rightarrow$ Ký toàn bộ 30 tờ"** kèm thanh tiến trình chạy nền.
- [x] **Mục 3.3:** Xây dựng Component **Màn hình Ký Cảm Ứng Bệnh Nhân (`PatientTabletSignModal.tsx`)**:
  - Giao diện tối ưu cho màn hình cảm ứng Tablet / Kiosk để người bệnh ký giấy cam đoan.
- [x] **Mục 3.4:** Xây dựng Component **Trình Xem Bệnh Án Điện Tử (`EmrDocumentViewerModal.tsx`)**:
  - Xem PDF đã ký, hiển thị thông tin chứng thư số, mã QR, lịch sử đính chính và nút in.
- [x] **Mục 3.5:** Tích hợp nút *"Xem / Ký EMR"* vào các màn hình Khám bệnh, Điều trị nội trú, Tiếp nhận.

---

### 🔹 GIAI ĐOẠN 4: Cổng Tra Cứu Tính Toàn Vẹn & Quản Lý Lưu Trữ (Verification & Archival)
- [x] **Mục 4.1:** Xây dựng trang tra cứu công khai `/#/portal/verify-doc`:
  - Cho phép người bệnh hoặc cơ quan BHYT quét mã QR trên tờ in để kiểm tra chữ ký số gốc và tính toàn vẹn của hồ sơ.
- [x] **Mục 4.2:** Tích hợp phân quyền xem bệnh án (Bác sĩ xem khoa mình, KHTH xem toàn viện, ghi log `emr_document_access_log`).

---

### 🔹 GIAI ĐOẠN 5: Kiểm Thử Toàn Trình (End-to-End Testing) & Nghiệm Thu
- [x] **Test Case 1:** Sinh Đơn thuốc ngoại trú $\rightarrow$ Xem trước $\rightarrow$ Ký số SmartCA $\rightarrow$ In ra giấy có mã QR.
- [x] **Test Case 2:** Bác sĩ nội trú chọn 20 tờ điều trị $\rightarrow$ Ký hàng loạt thành công trong 3 giây.
- [x] **Test Case 3:** Bệnh nhân ký tay trên Tablet vào Giấy cam đoan phẫu thuật $\rightarrow$ Bác sĩ ký số niêm phong.
- [x] **Test Case 4:** Sửa đổi tờ điều trị đã ký $\rightarrow$ Hệ thống sinh bản v2 và đóng watermark lên bản cũ v1.
- [x] **Test Case 5:** Đóng bệnh án ra viện $\rightarrow$ Kiểm tra file PDF Master có đầy đủ mục lục và số trang liên tục `Trang 1/N`.
- [x] **Kiểm tra TypeScript:** `npm run typecheck` trên cả Frontend và Backend đạt **0 lỗi**.
- [x] **Tài liệu bàn giao:** Cập nhật tài liệu kỹ thuật đầy đủ tại `modules/document-engine/docs/`.
