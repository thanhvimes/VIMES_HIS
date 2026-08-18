# PG-11 next-session checklist

## Mở phiên

- [ ] Đọc `PG11_PRODUCTION_BLOCKER_TRACKER.md`.
- [ ] Xác nhận owner/provider đã điền `SIGNING_PROVIDER_INTAKE_FORM.md`.
- [ ] Kiểm tra Docker, signing service và network policy.

## Khi đã có provider thật

- [ ] Inject secret qua Vault/KMS; không đặt secret trong `.env` hoặc image.
- [ ] Chạy `validate-production-config.ps1`.
- [ ] Kiểm tra `/ready`, `/v1/provider-info`, `/metrics/prometheus`.
- [ ] Chạy signed/tampered validation.
- [ ] Chạy `PROVIDER_FAILURE_MATRIX.md`.
- [ ] Chạy load/spike/soak theo SLA và lưu kết quả.
- [ ] Điền `PG11_EVIDENCE_MANIFEST_TEMPLATE.md`.
- [ ] Clinical/Security/Infrastructure/Legal review.
- [ ] Chỉ chuyển GO khi mọi blocker đã đóng.

## Lệnh kiểm tra staging nhanh

```powershell
docker compose -f services/pdf-signing/docker-compose.yml config
powershell -File services/pdf-signing/scripts/check-container-security.ps1 -Container vimes-pdf-signing-pkcs12
powershell -File services/pdf-signing/scripts/scan-sensitive-logs.ps1 -Container vimes-pdf-signing-pkcs12
```

Current decision: **STAGING READY / PRODUCTION NO-GO**.
