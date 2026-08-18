# Incident runbook

## Carbone không phản hồi

1. Kiểm tra `GET /api/template-studio/health`.
2. Kiểm tra health từng container và Nginx upstream.
3. Restart worker lỗi; không xóa Redis queue.
4. Theo dõi DLQ và retry sau khi Carbone healthy.

## Queue bị nghẽn

1. Đọc `/api/template-studio/preview/metrics`.
2. Tạm giảm traffic preview/batch.
3. Tăng worker theo CPU/RAM.
4. Không xóa queue nếu chưa có backup/đối soát.

## Rollback khẩn cấp

1. Xác định version đã publish ổn định.
2. Gọi rollback với lý do rõ ràng.
3. Kiểm tra active version và audit log.
4. Chạy smoke preview sau rollback.

## Redis/MinIO mất kết nối

1. Giữ backend ở trạng thái readiness `503`.
2. Khôi phục service và kiểm tra healthcheck.
3. Kiểm tra queue recovery/object tồn tại.
4. Retry DLQ sau khi hệ thống ổn định.

## Migration lỗi

1. Dừng deploy backend mới.
2. Lưu log migration và kiểm tra migration đã chạy một phần.
3. Không tự ý sửa lịch sử migration; tạo migration bổ sung có tính idempotent.
4. Chạy lại `npm run migrate` sau khi đã kiểm thử trên bản sao database.

## Redis mất dữ liệu

1. Giữ backend readiness ở `503` và không nhận thêm preview job.
2. Khôi phục Redis persistence/backup.
3. Kiểm tra queue metrics và DLQ.
4. Chạy lại các job production có đối soát, không tự động nhân đôi tài liệu.

## Khôi phục từ backup

1. Restore PostgreSQL metadata bằng file custom dump.
2. Restore MinIO artifact từ bản backup thứ hai.
3. Kiểm tra checksum DOCX và active version.
4. Chạy smoke test 5 template và kiểm tra health trước khi mở traffic.
