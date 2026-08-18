# Staging blockers

Các mục dưới đây chưa thể đánh dấu `pass` nếu chưa chạy staging thật:

1. Load 10/20/40 req/s và spike/sustained/soak.
2. Restart worker, Redis outage, MinIO outage.
3. P95 ≤ 3 giây, queue ổn định, RAM ổn định.
4. Preview Studio không ảnh hưởng luồng in nghiệp vụ.
5. HSM/USB Token cần driver và thiết bị production.

Điều kiện mở khóa: Docker Compose chạy đủ Redis, MinIO, Carbone LB/renderer, preview worker;
có dữ liệu test và quyền truy cập endpoint. Sau khi chạy, lưu JSON vào `staging-evidence/` và
reviewer ký xác nhận trong `STAGING_ACCEPTANCE_MATRIX.md`.

UI/Word acceptance còn yêu cầu browser session, tài khoản Publisher/Reviewer và Microsoft Word;
evidence fields đã chuẩn hóa trong `UI_ACCEPTANCE_SCRIPT.md`.

Browser session hiện chưa kết nối, nên 5 bước UI (admin login, mở Template Studio, kiểm tra 5 mẫu,
Field Catalog, tạo draft) vẫn pending; không đánh dấu tự động chỉ từ API/code.

Latest preflight 2026-08-12: Redis/MinIO/Carbone LB/preview worker missing; staging tests blocked.

Latest preflight: Redis/MinIO/Carbone LB/preview worker missing; staging tests blocked.
