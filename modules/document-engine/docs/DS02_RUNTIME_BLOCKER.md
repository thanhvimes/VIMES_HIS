# DS-02 runtime blocker

## Trạng thái

Code, CI contract và Docker Compose đã sẵn sàng. Chưa thể đóng PAdES gate vì môi trường hiện tại không có:

- Docker daemon đang chạy (Docker CLI có nhưng không kết nối được `docker_engine`).
- OpenSSL để tạo test PKCS#12.
- `pdfsig`/Adobe validator để xác nhận chữ ký và tamper.

## Cách mở khóa

1. Bật Docker Desktop và xác nhận `docker info` thành công.
2. Cài OpenSSL hoặc tạo PFX bằng CA/HSM staging được phê duyệt.
3. Cài Poppler `pdfsig` hoặc chuẩn bị Adobe Acrobat validator.
4. Chạy `PAdES_RUNTIME_ACCEPTANCE_RUNBOOK.md`.
5. Lưu `ready.json`, output `pdfsig`, SHA-256 signed/tampered và reviewer vào `staging-evidence/PG-11/<date>/`.

Không đánh dấu DS-02 PAdES B-T/B-LT đạt khi thiếu các evidence trên.
