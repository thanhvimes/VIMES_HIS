# Staging acceptance matrix

| Nhóm | Lệnh | Bằng chứng bắt buộc |
|---|---|---|
| Load 10/20/40 req/s | `node backend/scripts/run-template-load-suite.cjs` | P95, failure, queue depth |
| Spike/sustained/soak | `powershell -File backend/scripts/run-resilience-scenarios.ps1 -Scenario <name>` | RAM trend, lost jobs |
| Worker restart | `-Scenario restart-worker` | Queue recovery, duplicate IDs |
| Redis/MinIO outage | `-Scenario redis-interruption|minio-interruption` | Dependency health, retry/DLQ |
| Clinical isolation | `node backend/scripts/parallel-endpoint-probe.cjs` | Clinical endpoint errors = 0 |

## Resilience evidence fields

| Scenario | Required fields |
|---|---|
| Spike 5 phút | `p95Ms`, `failurePercent`, `queueGrowth` |
| Sustained 30 phút | `p95Ms`, `queueGrowth`, `completedJobs` |
| Soak 4 giờ | `ramGrowthPercent`, `lostJobs`, `duplicateArtifacts` |
| Worker restart | `recoveredJobs`, `duplicateIds`, `recoveryMs` |
| Redis/MinIO outage | `dependencyRecovered`, `retryCount`, `dlqCount` |

Kiểm tra đủ trường từng scenario bằng `node backend/scripts/validate-resilience-evidence.cjs evidence.json <scenario>`.

Chỉ đánh dấu đạt sau khi lưu JSON kết quả và người phụ trách staging ký xác nhận.

Khởi tạo bộ hồ sơ bằng chứng bằng `node backend/scripts/collect-staging-evidence.cjs`;
manifest được lưu tại `staging-evidence/manifest.json`.

Chạy nhanh 5 nhóm kiểm tra bằng `powershell -File backend/scripts/run-acceptance-bundle.ps1`;
kết quả được tách thành manifest, duplicate, clinical isolation và signing readiness.

Trước khi chạy benchmark, kiểm tra hạ tầng bằng `powershell -File backend/scripts/staging-preflight.ps1`.

Sau khi thu thập đủ bằng chứng, tạo báo cáo bằng `node backend/scripts/build-acceptance-report.cjs staging-evidence`.

Quét PHI/PII trong fixture và sample bằng `node backend/scripts/scan-template-data-phi.cjs <path>`;
mọi finding phải được masking hoặc reviewer phê duyệt là dữ liệu synthetic trước khi commit/deploy.

Các lệnh tương đương trong thư mục backend: `npm run acceptance:preflight`, `acceptance:bundle`,
`acceptance:smoke` và `acceptance:report`.

Nếu dependency chưa chạy, tham chiếu `STAGING_BLOCKERS.md`; không đánh dấu pass chỉ dựa trên việc script tồn tại.

Workflow Publisher/API smoke có thể chạy bằng `TEMPLATE_API_TOKEN=... node backend/scripts/publisher-workflow-smoke.cjs`.

Validate 5 tiêu chí bằng `node backend/scripts/validate-acceptance-evidence.cjs evidence.json`:
lost jobs, duplicate artifacts, P95 3 giây, queue ổn định và RAM ổn định.
