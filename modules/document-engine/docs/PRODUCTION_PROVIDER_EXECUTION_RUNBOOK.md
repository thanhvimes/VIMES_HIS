# Production provider execution runbook

1. Điền `SIGNING_PROVIDER_INTAKE_FORM.md` và phê duyệt vendor/SLA.
2. Cấp trust chain, TSA, OCSP/CRL; inject secret qua Vault/KMS, không sửa image.
   Chạy `validate-production-config.ps1` trước khi khởi động container.
3. Chọn provider adapter (`pkcs11`, `local-agent` hoặc `remote-ca`) và bật mTLS/network policy.
4. Chạy `/ready`, `/v1/provider-info`, `/metrics/prometheus`.
5. Ký PDF synthetic, validate signed; sửa 1 byte và validate tampered phải invalid.
   Retry cùng `X-Idempotency-Key` phải trả cùng kết quả và không tạo thêm chữ ký/audit event.
6. Kiểm thử TSA timeout/outage, certificate rotation và provider failover.
   Với nhiều replica, bắt buộc dùng shared idempotency store (Redis/PostgreSQL); không dùng dictionary in-memory của demo.
   Dùng ma trận `services/pdf-signing/monitoring/PROVIDER_FAILURE_MATRIX.md` để ghi evidence từng kịch bản.
7. Chạy load/spike/soak theo SLA 5.000 lượt tiếp đón/ngày.
   Dùng `python services/pdf-signing/scripts/load_test.py --input <synthetic.pdf> --requests 100 --concurrency 10` và lưu p50/p95/p99, throughput, lỗi vào evidence.
8. Lưu manifest theo `PG11_EVIDENCE_MANIFEST_TEMPLATE.md`.
9. Clinical/Security/Infrastructure/Legal review và quyết định GO/NO-GO.

Không dùng dữ liệu bệnh nhân thật trong bước 5–8 nếu chưa có phê duyệt PHI test.
