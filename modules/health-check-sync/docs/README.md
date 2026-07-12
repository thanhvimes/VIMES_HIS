# HƯỚNG DẪN & TỔNG QUAN MODULE LIÊN THÔNG KHÁM SỨC KHỎE (VNeID)

Tài liệu này tổng hợp toàn bộ cấu trúc và chức năng của module **health-check-sync** phục vụ liên thông dữ liệu Khám sức khỏe định kỳ và sàng lọc lên ứng dụng VNeID theo quy chuẩn **Quyết định 1551/QĐ-BYT** của Bộ Y tế.

---

## 1. Thiết Kế Cơ Sở Dữ Liệu (Master-Detail Schema)

Module sử dụng mô hình quan hệ Master-Detail để tách biệt thông tin quản trị và dữ liệu kết quả khám động:

### Bảng Master (`health_check_masters`)
Lưu trữ thông tin hành chính của bệnh nhân, thông tin chữ ký số và trạng thái đồng bộ cổng y tế.
*   **Các trường chính:**
    *   `id`: SERIAL (Khóa chính)
    *   `patient_id`: Mã bệnh nhân (VARCHAR)
    *   `patient_name`: Họ và tên (VARCHAR)
    *   `cccd`: Số căn cước công dân hoặc hộ chiếu (VARCHAR)
    *   `dob`: Ngày sinh (DATE)
    *   `gender`: Giới tính (VARCHAR)
    *   `doc_no`: Số hồ sơ KSK (VARCHAR, UNIQUE)
    *   `form_type`: Loại mẫu biểu y tế từ 1 đến 17 (VARCHAR)
    *   `send_status`: Trạng thái đồng bộ (`Unsent`, `Pending`, `Success`, `Error`)
    *   `signature_status`: Trạng thái ký số (`Unsigned`, `Signed`)
    *   `signature_type`: Phương thức ký (`USB`, `HSM`)
    *   `signature`: Chuỗi chữ ký số Base64 (TEXT)
    *   `xml_data`: Chuỗi XML dữ liệu liên thông thô (TEXT)
    *   `sent_at`: Thời gian đồng bộ thành công (TIMESTAMP)
    *   `transaction_id`: Mã giao dịch từ cổng VNeID (VARCHAR)
    *   `error_message`: Chi tiết lỗi nếu đồng bộ thất bại (VARCHAR)

### Bảng Chi tiết (`health_check_details`)
Lưu trữ kết quả khám chi tiết dưới dạng JSONB để tối ưu cho việc truy vấn linh hoạt theo các biểu mẫu khác nhau.
*   **Các trường chính:**
    *   `id`: SERIAL (Khóa chính)
    *   `master_id`: Khóa ngoại liên kết tới bảng Master (ON DELETE CASCADE)
    *   `clinical_data`: Kết quả khám lâm sàng & thể lực (JSONB)
    *   `lab_data`: Kết quả cận lâm sàng & xét nghiệm (JSONB)
    *   `conclusion_data`: Phân loại sức khỏe & kết luận (JSONB)

### Tối ưu hóa Index
*   **B-Tree Indexes:** Tối ưu hóa tìm kiếm nhanh trên các trường: `patient_id`, `patient_name`, `cccd`, `send_status`, `doc_no`.
*   **GIN Indexes:** Tạo trên `clinical_data` và `lab_data` để tăng tốc độ truy vấn sâu vào các trường bên trong JSON.

---

## 2. API Backend & Định tuyến (Routes)

Mã nguồn xử lý Backend được viết bằng **TypeScript**:
*   **Định tuyến chính:** Đăng ký tại `backend/src/server.ts` dưới path `/api/v1/health-check-sync`.
*   **Các Endpoints:**
    *   `GET /documents`: Lấy danh sách hồ sơ kèm phân trang, lọc nâng cao theo tên, mã, CCCD, trạng thái ký, trạng thái gửi cổng, và loại biểu mẫu.
    *   `GET /documents/:id`: Lấy chi tiết hồ sơ (kèm kết nối Master-Detail).
    *   `POST /documents`: Tạo mới hồ sơ khám sức khỏe (Sinh dữ liệu XML thô và chèn dữ liệu vào bảng Master + Detail trong một giao dịch DB duy nhất).
    *   `PUT /documents/:id`: Cập nhật thông tin hồ sơ (Tự động đặt lại trạng thái ký số về `Unsigned` và trạng thái đồng bộ về `Unsent`).
    *   `DELETE /documents/:id`: Xóa hồ sơ (Cascading tự động xóa dữ liệu chi tiết).
    *   `POST /documents/sign`: Thực hiện ký số hàng loạt (Hỗ trợ USB Token tại máy trạm hoặc HSM Cloud CA tập trung).
    *   `POST /documents/send`: Thực hiện đồng bộ gửi dữ liệu hàng loạt lên cổng giám định VNeID.
    *   `POST /documents/create-mock`: Tạo 17 hồ sơ thử nghiệm tương ứng 17 mẫu biểu KSK của Bộ Y tế phục vụ chạy thử.

---

## 3. Cấu trúc Giao diện Frontend (React & Tailwind CSS)

Hệ thống giao diện được modulize hóa thành các component độc lập:

1.  **Màn hình quản lý (`HealthCheckSyncView.tsx`):**
    *   Điểm điều phối chung, lưu trữ trạng thái danh sách, tìm kiếm, lọc và thực hiện các cuộc gọi API thông qua `healthCheckService.ts`.
2.  **Bảng điều khiển (`Dashboard.tsx`):**
    *   Hiển thị thống kê nhanh số lượng hồ sơ KSK.
    *   Biểu đồ thống kê trực quan số lượng hồ sơ theo từng loại mẫu biểu trong 17 mẫu.
    *   Hộp điều khiển hiển thị log lỗi đồng bộ chi tiết thời gian thực.
3.  **Danh sách hồ sơ (`DocumentList.tsx`):**
    *   Bảng dữ liệu hiển thị thông tin bệnh nhân, mã hồ sơ, loại mẫu biểu y tế kèm nhãn màu đặc trưng.
    *   Trạng thái trực quan: Badge hiển thị trạng thái ký số (USB/HSM) và trạng thái đồng bộ cổng (Thành công/Lỗi/Đang gửi).
    *   Cho phép chọn nhiều để ký số hoặc gửi cổng hàng loạt.
4.  **Biểu mẫu động (`DynamicForm.tsx`):**
    *   Tự động thay đổi giao diện nhập liệu tùy thuộc vào Mẫu KSK được chọn.
    *   Hiển thị thêm trường đặc thù: Giấy phép lái xe đề nghị (Mẫu 3), Tiêu chuẩn chạy tàu (Mẫu 4), Khả năng đi biển (Mẫu 5), Cân nặng lúc sinh & Đánh giá mốc phát triển tinh thần/vận động (Mẫu 6-12 cho trẻ em).
5.  **Bản in chuẩn A4 (`PrintForm.tsx`):**
    *   Giao diện thiết kế theo tỷ lệ A4 chuẩn để in ấn trực tiếp từ trình duyệt.
    *   Hiển thị mộc ký số y khoa (Digital Signature Seal) dạng đồ họa nếu hồ sơ đã được ký số thành công.

---

## 4. Danh sách các file liên quan trong Module

*   **Database Migration:**
    *   [backend/migrations/014_create_health_check_documents.sql](file:///d:/AI/vClinic/backend/migrations/014_create_health_check_documents.sql)
    *   [backend/migrations/015_setup_health_check_sync.sql](file:///d:/AI/vClinic/backend/migrations/015_setup_health_check_sync.sql)
*   **Backend Controller & Router:**
    *   [backend/src/controllers/health-check.controller.ts](file:///d:/AI/vClinic/backend/src/controllers/health-check.controller.ts)
    *   [backend/src/routes/health-check.routes.ts](file:///d:/AI/vClinic/backend/src/routes/health-check.routes.ts)
    *   [backend/src/server.ts](file:///d:/AI/vClinic/backend/src/server.ts)
*   **Frontend View & Components:**
    *   [services/healthCheckService.ts](file:///d:/AI/vClinic/services/healthCheckService.ts)
    *   [modules/insurance/index.tsx](file:///d:/AI/vClinic/modules/insurance/index.tsx)
    *   [modules/health-check-sync/views/HealthCheckSyncView.tsx](file:///d:/AI/vClinic/modules/health-check-sync/views/HealthCheckSyncView.tsx)
    *   [modules/health-check-sync/components/Dashboard.tsx](file:///d:/AI/vClinic/modules/health-check-sync/components/Dashboard.tsx)
    *   [modules/health-check-sync/components/DocumentList.tsx](file:///d:/AI/vClinic/modules/health-check-sync/components/DocumentList.tsx)
    *   [modules/health-check-sync/forms/DynamicForm.tsx](file:///d:/AI/vClinic/modules/health-check-sync/forms/DynamicForm.tsx)
    *   [modules/health-check-sync/forms/PrintForm.tsx](file:///d:/AI/vClinic/modules/health-check-sync/forms/PrintForm.tsx)

---

## 5. Tài liệu nâng cấp liên thông theo Quyết định sửa đổi QĐ 1551 (QĐ 2062/QĐ-BYT)

Để phục vụ đội phát triển vClinic HIS nâng cấp hệ thống liên thông đáp ứng Quyết định mới **2062/QĐ-BYT năm 2026**, toàn bộ hồ sơ đặc tả thiết kế kỹ thuật đã được xây dựng hoàn chỉnh:

*   📋 **Checklist triển khai**: [checklist.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/checklist.md)
*   📈 **Báo cáo tiến độ thực tế**: [implementation-progress.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/implementation-progress.md)
*   🩺 **Phân tích tác động (Impact)**: [impact-analysis.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/impact-analysis.md)
*   💾 **Thiết kế Cơ sở dữ liệu (PostgreSQL)**: [database-design.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/database-design.md)
*   📡 **Đặc tả API & Thuật toán Checksum**: [api-design.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/api-design.md)
*   🔄 **Sơ đồ quy trình nghiệp vụ (Workflow)**: [workflow.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/workflow.md)
*   🗺️ **Bảng Mapping trường dữ liệu 3 nhóm tuổi**: [mapping.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/mapping.md)
*   🧪 **Kế hoạch kiểm thử & Test Cases**: [testing-plan.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/testing-plan.md)
*   🚀 **Kế hoạch phát hành & Deploy/Rollback**: [release-plan.md](file:///d:/AI/vClinic/modules/health-check-sync/docs/release-plan.md)
*   📄 **Các báo cáo tổng hợp & đối chiếu lịch sử**:
    *   [Báo cáo đối chiếu so sánh y khoa](file:///d:/AI/vClinic/modules/health-check-sync/docs/QD1551_DoiChieu_SoSanh.md)
    *   [Kế hoạch triển khai ban đầu](file:///d:/AI/vClinic/modules/health-check-sync/docs/QD1551_KeHoachTrienKhai.md)
    *   [Báo cáo tổng kết nâng cấp](file:///d:/AI/vClinic/modules/health-check-sync/docs/QD1551_BaoCaoTongHop.md)
