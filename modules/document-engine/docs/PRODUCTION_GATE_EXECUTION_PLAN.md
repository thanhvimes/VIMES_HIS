# Kế hoạch thực hiện Production Gate

## Nguyên tắc nghiệm thu

- Một hạng mục chỉ hoàn thành khi có implementation, test đã chạy, evidence và người chịu trách nhiệm xác nhận.
- Không dùng fixture giả để kết luận production pass.
- Evidence lưu tại `staging-evidence/<gate>/<yyyy-mm-dd>/` và không chứa mật khẩu/private key/PHI thật.
- Một gate Critical/High chưa đạt thì quyết định go-live là `NO-GO`.

## Thứ tự bắt buộc

| Ưu tiên | Gate | Owner chính | Điều kiện hoàn thành |
|---:|---|---|---|
| 1 | PG-01 Active version | Backend/Architecture | Publish/rollback integration test đạt |
| 2 | PG-02 Permission | Backend/Security | Negative permission E2E đạt |
| 3 | PG-03 PHI/Encryption | Security/Infrastructure | TLS, KMS, masking và retention được xác nhận |
| 4 | PG-04 Template correctness | Clinical/Template team | Clinical sign-off và visual regression đạt |
| 5 | PG-05 Performance | QA/Performance | Load/spike/sustained/soak report đạt SLA |
| 6 | PG-06 HA | Infrastructure/Backend | Dependency outage và worker isolation đạt |
| 7 | PG-07 DR | DBA/Infrastructure | Restore drill đạt RPO/RTO |
| 8 | PG-08 UI workflow | QA/Product | E2E và evidence đầy đủ |
| 9 | PG-09 Operations | Operations/SRE | Alert và incident drill đạt |
| 10 | PG-10 Release | Release board | Đủ chữ ký và rollback plan |
| 11 | PG-11 PDF Digital Signature | Backend/Security/Clinical/Legal | Hai chế độ đặt vùng, PAdES, provider thật và tamper test đạt |

Tài liệu triển khai provider và tiêu chí chuyển production: `SIGNING_PROVIDER_PRODUCTION_CHECKLIST.md`.
Runbook thực thi khi đủ đầu vào CA/provider: `PRODUCTION_PROVIDER_EXECUTION_RUNBOOK.md`.

## Báo cáo trạng thái

Mỗi gate dùng trạng thái `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `PASSED`. Báo cáo phải ghi:

- Ngày chạy và môi trường.
- Commit/application version.
- Người thực hiện và reviewer.
- Lệnh/test case đã chạy.
- Link evidence.
- Lỗi còn lại và quyết định `GO/NO-GO`.
