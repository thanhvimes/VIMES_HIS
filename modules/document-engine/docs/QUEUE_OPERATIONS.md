# Queue vận hành render document

## Cấu hình khuyến nghị

```env
REDIS_URL=redis://127.0.0.1:6379
TEMPLATE_PREVIEW_WORKER_CONCURRENCY=4
```

Mỗi worker Carbone nên bắt đầu với concurrency 2–4. Tăng dần sau khi đo CPU/RAM và thời gian render thực tế. Không đặt concurrency cao hơn khả năng xử lý của Carbone/LibreOffice.

## Quy trình production

1. Chạy Redis có persistence và backup.
2. Chạy ít nhất hai preview worker để có HA.
3. Theo dõi API `/api/template-studio/preview/metrics`.
4. Khi DLQ tăng liên tục, dừng retry tự động và kiểm tra template/data contract.
5. Retry DLQ sau khi đã sửa nguyên nhân.

BullMQ giữ job trong Redis khi worker restart; job đang dở sẽ được đánh dấu stalled và được worker khác nhận lại theo cơ chế lock/retry.

## Theo dõi tài nguyên renderer

Chạy `powershell -File backend/scripts/monitor-carbone-resources.ps1` để lấy mẫu CPU/RAM
của các container Carbone. Script cảnh báo khi CPU hoặc RAM vượt 85%; ngưỡng và số mẫu
có thể điều chỉnh bằng `-CpuAlertPercent`, `-MemoryAlertPercent`, `-Samples`.

## Chạy profile kiểm thử tải

`node backend/scripts/run-template-load-profiles.cjs <profile>` với các profile:
`smoke10`, `load20`, `load40`, `spike5m`, `sustained30m`, `soak4h`.
Kết quả queue latency/P95 cần được ghi nhận từ metrics sau mỗi lần chạy.

Soak test có thể theo dõi xu hướng RAM bằng `backend/scripts/monitor-carbone-memory-trend.ps1`;
script cảnh báo khi mức tăng từ mẫu đầu vượt ngưỡng `-GrowthPercentAlert`.

Sau khi restart worker, chạy `node backend/scripts/verify-template-queue-recovery.cjs`.
Đặt `QUEUE_RECOVERY_EXPECTED` để bắt buộc kiểm tra đủ số job và script sẽ phát hiện ID trùng.

Sau batch, quét artifact trùng bằng `node backend/scripts/audit-duplicate-artifacts.cjs <storageRoot>`.

Đánh giá kết quả benchmark bằng `node backend/scripts/evaluate-template-benchmark.cjs result.json`.
Ngưỡng mặc định: P95 ≤ 3 giây, queue không tăng và failure ≤ 1%; có thể cấu hình qua biến môi trường.

Kiểm tra cô lập Preview Studio với luồng nghiệp vụ bằng `node backend/scripts/parallel-endpoint-probe.cjs`;
cấu hình `PROBE_PREVIEW_PATH`, `PROBE_CLINICAL_PATH`, `PROBE_COUNT` theo staging.

Chạy toàn bộ profile bằng `node backend/scripts/run-template-load-suite.cjs`; kết quả từng profile
được lưu trong `benchmark-results/` để đánh giá sau bằng evaluator.

Resilience scenarios chạy bằng `powershell -File backend/scripts/run-resilience-scenarios.ps1 -Scenario <name>`;
các scenario gồm `soak4h`, `restart-worker`, `redis-interruption`, `minio-interruption`, `p95-evaluation`.

Tổng hợp tiêu chí nghiệm thu bằng `node backend/scripts/evaluate-resilience-criteria.cjs result.json`;
script kiểm tra lost jobs, duplicate artifact, P95, queue growth và RAM growth.

Sau restart hoặc gián đoạn dependency, chạy `node backend/scripts/dependency-health-probe.cjs` để xác nhận
API, Carbone và MinIO đã phục hồi trước khi mở lại traffic.

## Ngưỡng cảnh báo ban đầu

- `waiting > 500`: tăng worker hoặc giảm tải preview.
- `failed > 20/5 phút`: kiểm tra Carbone và contract.
- DLQ tăng liên tục: cảnh báo nghiêm trọng.
- `active` kẹt quá 5 phút: kiểm tra worker/Redis.

Các ngưỡng trên là baseline, cần hiệu chỉnh bằng benchmark staging trước khi áp dụng production.
