
# HƯỚNG DẪN TỐI ƯU HIỆU NĂNG & MỞ RỘNG (SCALE 10.000+ BỆNH NHÂN/NGÀY)

Tài liệu này dành cho đội ngũ kỹ thuật khi triển khai hệ thống tại các bệnh viện quy mô lớn, đảm bảo hệ thống không bị quá tải ("treo") khi lượng giao dịch tăng đột biến.

## 1. Quản lý Kết nối (Connection Pooling) - QUAN TRỌNG NHẤT
PostgreSQL có giới hạn số lượng kết nối (max_connections). Với quy mô 10.000 bệnh nhân, số lượng request đồng thời rất lớn.

*   **Vấn đề:** Nếu kết nối trực tiếp (Direct Connection), DB sẽ sập khi có > 200 người dùng cùng lúc.
*   **Giải pháp:** Sử dụng **Supavisor (Connection Pooler)** có sẵn trong Supabase.
    *   Luôn sử dụng **Transaction Mode** (Port `6543`) cho các ứng dụng Serverless hoặc API Backend.
    *   Chỉ dùng Session Mode (Port `5432`) cho các lệnh thay đổi cấu trúc bảng (Migration).
    *   Cấu hình trong `src/services/apiClient.ts` hoặc biến môi trường Backend.

## 2. Chiến lược Đánh Index (Indexing Strategy)
Dữ liệu y tế lớn rất nhanh. Truy vấn không Index là nguyên nhân số 1 gây treo hệ thống.

*   **Quy tắc:** Đánh Index cho bất kỳ cột nào xuất hiện trong mệnh đề `WHERE`, `JOIN`, hoặc `ORDER BY`.
*   **SQL Ví dụ:**
    ```sql
    -- Index cho tìm kiếm bệnh nhân
    CREATE INDEX idx_patient_phone ON patients(phone);
    CREATE INDEX idx_patient_search ON patients USING GIN(to_tsvector('vietnamese', full_name)); -- Full text search
    
    -- Index cho lịch sử khám (tìm theo ngày và bác sĩ)
    CREATE INDEX idx_exam_date_doctor ON clinical_records(exam_date, doctor_id);
    ```

## 3. Phân vùng Dữ liệu (Table Partitioning)
Các bảng như `Billing`, `Prescriptions`, `LabResults` sẽ có hàng triệu dòng.
*   **Giải pháp:** Sử dụng **Partitioning by Range** (theo năm hoặc tháng).
*   **Lợi ích:** Khi query dữ liệu tháng 11, DB chỉ quét phân vùng tháng 11, bỏ qua các tháng khác -> Tốc độ cực nhanh.

## 4. Tối ưu hóa Realtime (Supabase Realtime)
Realtime rất tốn tài nguyên. Đừng bật bừa bãi.
*   **CHỈ BẬT Realtime cho:**
    *   Màn hình gọi số (Queue).
    *   Thông báo khẩn cấp (Emergency).
    *   Chat nội bộ.
*   **KHÔNG BẬT Realtime cho:**
    *   Danh sách hồ sơ bệnh án (Dùng `Polling` hoặc `Manual Refresh`).
    *   Báo cáo thống kê.

## 5. Cấu hình Hạ tầng (Infrastructure)
Với quy mô 10k visits/day:
*   **Cloud (Supabase.com):**
    *   Nâng cấp lên gói **Pro** hoặc **Team**.
    *   Bật **Compute Add-on** (tối thiểu 4GB RAM, 2 vCPU).
    *   Cấu hình **Point-in-Time Recovery (PITR)** để backup dữ liệu từng giây.
*   **On-Premise (Self-Host):**
    *   Server: Tối thiểu 32GB RAM, 8 vCPU, ổ cứng NVMe (Rất quan trọng cho Database).
    *   Sử dụng Docker Swarm hoặc Kubernetes để quản lý container.

## 6. Xử lý logic nặng (Background Jobs)
Đừng bắt người dùng chờ khi hệ thống đang xử lý tác vụ nặng.
*   **Ví dụ:** Khi chốt viện phí, cần tính toán BHYT, cập nhật kho, gửi báo cáo Bộ Y tế.
*   **Giải pháp:** Sử dụng **Supabase Edge Functions** hoặc **Message Queue (Redis/RabbitMQ)** để xử lý ngầm (Asynchronous).
    *   Frontend gửi request -> Backend trả về "Đang xử lý" -> Worker chạy ngầm -> Báo lại Frontend qua Realtime/Notification khi xong.

---
**Kết luận:** Công nghệ Supabase/Postgres hoàn toàn đáp ứng được. Chìa khóa là thiết kế Database chuẩn và quản lý kết nối tốt.
