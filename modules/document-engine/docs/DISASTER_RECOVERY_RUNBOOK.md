# Template Studio — Disaster Recovery Runbook

## 1. Kích hoạt

Kích hoạt khi mất node backend, MinIO, Redis hoặc database. Ghi nhận thời điểm, incident ID,
RPO/RTO mục tiêu và đóng luồng publish mới trong thời gian khôi phục.

## 2. Khôi phục metadata PostgreSQL

1. Khôi phục bản dump `hms_document_*` vào database dự phòng.
2. Chạy toàn bộ migration còn thiếu.
3. Kiểm tra số template/version và trạng thái `PUBLISHED`.
4. Kiểm tra checksum DOCX trong metadata trước khi mở publish.

## 3. Khôi phục artifact MinIO

1. Dựng MinIO dự phòng và tạo ba bucket private.
2. Dùng `backup-template-minio.ps1` để lấy bản sao từ storage thứ hai hoặc copy ngược bằng `mc mirror`.
3. Chạy `verify-template-minio-backup.ps1 -BackupPath <path>`.
4. Kiểm thử tải một DOCX/PDF và xác nhận checksum khớp metadata.

## 4. Khôi phục Redis/BullMQ

Redis chỉ chứa job tạm thời; không khôi phục job cũ nếu artifact đã hoàn tất. Dựng Redis mới,
khởi động worker và chạy `verify-template-queue-recovery.cjs` cho các job cần giữ. Job thiếu
được tạo lại bằng idempotency key của nghiệp vụ.

## 5. Kiểm tra sau khôi phục

- Health Carbone, Redis, MinIO và database đều healthy.
- Preview DOCX/PDF một template đã publish.
- Download artifact bằng signed URL.
- Kiểm tra audit log và quyền reviewer/publisher.
- Theo dõi metrics tối thiểu 30 phút trước khi mở lại publish.

## 6. Kết thúc

Ghi nhận RTO/RPO thực tế, nguyên nhân, artifact hoặc job mất (nếu có), và tạo postmortem.
