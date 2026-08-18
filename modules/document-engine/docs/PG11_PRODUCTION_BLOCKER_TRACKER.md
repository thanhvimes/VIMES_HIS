# PG-11 production blocker tracker

| ID | Blocker | Owner cần phản hồi | Đầu vào cần cung cấp | Tiêu chí đóng |
|---|---|---|---|---|
| B-01 | Chưa chọn provider ký thật | Infrastructure/Security | HSM, USB Token/Agent hoặc Remote CA; vendor/SLA | Intake form được phê duyệt |
| B-02 | Chưa có trust chain/chứng thư CA | CA provider/Security | Certificate chain, fingerprint, key usage | Validator tin cậy certificate |
| B-03 | Chưa có TSA/OCSP/CRL production | CA provider/Security | RFC3161, OCSP, CRL endpoints | Signed PDF có timestamp/revocation evidence |
| B-04 | Chưa có secret management/shared store | Infrastructure | Vault/KMS path, Redis/PostgreSQL path, rotation, access policy | Không secret trong image/source/log; idempotency dùng shared store |
| B-05 | Chưa chốt SLA tải | QA/Infrastructure | p95/p99, throughput, concurrency, availability | Load/spike/soak report đạt SLA |
| B-06 | Chưa nghiệm thu liên phòng ban | Clinical/Security/Legal | Reviewer và biên bản ký | GO/NO-GO được phê duyệt |

Current decision: **NO-GO for production; STAGING READY**.
