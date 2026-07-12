# KẾ HOẠCH PHÁT HÀNH & NÂNG CẤP HỆ THỐNG (RELEASE PLAN)

Tài liệu này hướng dẫn chi tiết quy trình triển khai nâng cấp (Deployment) và phương án dự phòng khôi phục (Rollback) cho Module liên thông Khám sức khỏe vClinic đáp ứng Quyết định 2062/QĐ-BYT.

---

## 1. Quy trình triển khai (Deployment Steps)

### Bước 1: Sao lưu Cơ sở dữ liệu (Backup)
* Thực hiện backup toàn bộ database PostgreSQL hiện tại trước khi chạy script migration để đảm bảo an toàn dữ liệu lịch sử khám sức khỏe của phòng khám:
  ```bash
  pg_dump -U postgres -d vimes_130 -f backup_vclinic_before_qd2062.sql
  ```

### Bước 2: Chạy migration database cập nhật Schema
* Chạy runner migration `034` để bổ sung các trường thông tin người giám hộ và bảng lưu chữ ký số bác sỹ chuyên khoa:
  ```bash
  node run_migration_034.cjs
  ```
* Kiểm tra log output của script migration để xác minh các bảng và cột đã được tạo thành công.

### Bước 3: Build và deploy mã nguồn mới
* Tiến hành build ứng dụng frontend và backend:
  ```bash
  npm run build
  ```
* Khởi động lại service PM2 hoặc docker container của backend vClinic:
  ```bash
  pm2 restart vclinic-backend
  ```

---

## 2. Phương án khôi phục khi gặp sự cố (Rollback Plan)

Trong trường hợp hệ thống gặp lỗi nghiêm trọng sau khi nâng cấp (ví dụ: lỗi crash server, lỗi sinh XML không tương thích ngược làm ngắt quãng hoạt động tiếp đón đoàn khám):

1. **Khôi phục mã nguồn (Source Code Rollback)**:
   * Thực hiện revert code về commit ổn định gần nhất trên Git:
     ```bash
     git revert HEAD
     npm run build
     pm2 restart vclinic-backend
     ```
2. **Khôi phục Cơ sở dữ liệu (Database Rollback)**:
   * Restore lại bản backup database đã thực hiện ở Bước 1:
     ```bash
     psql -U postgres -d vimes_130 -f backup_vclinic_before_qd2062.sql
     ```
