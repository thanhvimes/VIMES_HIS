# PG-03 Security evidence

## Đã kiểm chứng tự động

- `backend/scripts/check-production-security.cjs`: preflight các cờ permission, database source, TLS DB/Redis/S3, KMS và sample-data mode.
- `backend/scripts/scan-template-data-phi.cjs`: quét fixture `.json/.ts/.js/.cjs` để phát hiện khóa PHI phổ biến và chuỗi định danh dài.
- Kết quả local ngày 2026-08-12: scanner chạy trên `backend/benchmark-data` với `passed: true`.
- Workflow CI `.github/workflows/template-studio-checks.yml` đã chạy scanner trên mọi thay đổi Template Studio/document-engine.

## Điều kiện còn bắt buộc trước production

- Bật TLS thật giữa backend–PostgreSQL–Redis–MinIO–Carbone trong mạng bệnh viện và lưu chứng cứ kết nối.
- Cấu hình SSE-KMS/encryption-at-rest cho PostgreSQL/MinIO, kiểm thử restore bằng key hợp lệ.
- Clinical/Data Protection owner duyệt masking, retention và quy trình xóa preview/test artifact.
- Chỉ cho phép `TEMPLATE_SAMPLE_DATA_MODE=synthetic` hoặc dữ liệu đã được phê duyệt; không dùng hồ sơ bệnh nhân thật trong fixture.
