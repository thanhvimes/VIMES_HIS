# Production Signing Provider Checklist

## 1. Chọn mô hình provider

- [ ] HSM nội bộ qua PKCS#11: xác nhận vendor, library path, slot/token và HA.
- [ ] USB Token qua Local Agent: agent chạy trong mạng bệnh viện, mTLS với signing service.
- [ ] Remote CA: xác nhận API ký, OAuth/mTLS, callback hoặc polling và SLA.
- [ ] Không dùng `SIGNING_PROVIDER=test` hoặc PFX test trong production.

## 2. Bảo mật khóa

- [ ] Private key không nằm trong source, image hoặc volume backup.
- [ ] PIN/secret lấy từ Vault/KMS/secret manager; không ghi log.
- [ ] Phân quyền service account tối thiểu; rotation và thu hồi được kiểm thử.
- [ ] Audit ghi request ID, signer identity, document hash, thời gian và kết quả; không ghi CMS/private key/PHI.
- [x] Có script `services/pdf-signing/scripts/scan-sensitive-logs.ps1` để scan log container; cần đưa vào release gate production.
- [x] CI release gate đã chạy container security và sensitive-log scan trên signing image.
- [x] Production config gate đã kiểm thử pass/fail: chặn provider test, bind public và thiếu TSA/OCSP/CRL.
- [x] Production env mẫu có concurrency limit/idempotency TTL và đã chạy qua config gate.
- [x] CI chạy negative tests cho production config gate trên mỗi thay đổi signing service.

## 3. PAdES và pháp lý

- [ ] Chứng thư CA hợp lệ, đúng mục đích `digitalSignature`/`nonRepudiation`.
- [x] Readiness kiểm tra file chứng thư, metadata và tự trả `503` khi chứng thư hết hạn.
- [x] `provider-info` trả `expires_in_days` và cảnh báo `CERTIFICATE_EXPIRING_SOON` trong 30 ngày; cần nối vào alert dashboard.
- [ ] PAdES-B-T có TSA RFC 3161; hồ sơ lưu dài hạn đánh giá B-LT/B-LTA.
- [ ] Adapter pyHanko phải thực sự gọi TSA/OCSP/CRL đã cấu hình; chỉ truyền biến môi trường không được coi là đạt.
- [ ] TSA implementation dùng `pyhanko.sign.timestamps.HTTPTimeStamper` và `pyhanko.sign.signers.PdfTimeStamper`; test outage/timeout và xác minh timestamp token độc lập (chờ endpoint CA thật).
- [x] Adapter ký đã truyền `HTTPTimeStamper` vào `signers.sign_pdf` khi có `SIGNING_TSA_URL`; contract tests 11/11.
- [ ] OCSP/CRL và trust store được cấu hình, có kế hoạch khi TSA/CA outage.
- [ ] Adobe/validator độc lập xác nhận signed hợp lệ và tampered invalid.

## 4. Vận hành và tải

- [ ] Readiness chỉ trả 200 khi provider, certificate và dependency thật sự sẵn sàng.
- [ ] Timeout, retry có giới hạn, circuit breaker và idempotency được kiểm thử.
- [x] Idempotency key đã có ở API staging; production bắt buộc chuyển sang Redis/PostgreSQL shared store khi chạy nhiều replica.
- [x] Staging đã kiểm thử retry cùng `X-Idempotency-Key`; production cần chứng minh shared-store behavior khi failover.
- [x] Đã đặc tả shared idempotency Redis/PostgreSQL tại `SHARED_IDEMPOTENCY_DESIGN.md`; implementation production còn chờ hạ tầng được phê duyệt.
- [ ] Load test theo SLA bệnh viện (đỉnh tiếp đón 5.000 bệnh nhân/ngày).
- [ ] Dashboard/alert cho latency, lỗi provider, queue, certificate sắp hết hạn.
- [x] Endpoint `/metrics` theo dõi request, success, error và rejection do kích thước; cần nối Prometheus/Grafana khi triển khai.
- [x] Metrics trả `sign_duration_ms_avg` để đặt cảnh báo SLA latency trực tiếp.
- [x] Endpoint `/metrics/prometheus` xuất metrics chuẩn để Prometheus scrape; contract tests 10/10.
- [x] Tài liệu scrape/rules vận hành tại `services/pdf-signing/monitoring/README.md`.
- [x] Alert concurrency rejection tăng đột biến để SRE điều chỉnh worker/queue.
- [ ] Alert đề xuất: error rate > 1%/5 phút, latency trung bình vượt SLA, rejection size tăng đột biến, `expires_in_days <= 30`.

## 5. Go-live evidence

- [ ] Evidence lưu tại `staging-evidence/PG-11/<date>/`, không chứa private key/PIN/PHI.
- [x] Có manifest chuẩn hóa hash, validator, certificate, TSA/OCSP/CRL, load test và quyết định GO/NO-GO.
- [ ] Clinical, Security, Infrastructure và Legal ký xác nhận.
- [ ] Có rollback về phiên bản signing service trước đó và diễn tập phục hồi.

## Trạng thái hiện tại

### Đã hoàn thành trong staging

- [x] PAdES-B-T signing và independent tamper validation: signed `VALID`, tampered `INVALID`.
- [x] Readiness fail-closed cho provider chưa triển khai, thiếu PFX và certificate hết hạn.
- [x] Size guard input/output, base64 validation và metrics JSON/Prometheus.
- [x] Prometheus scrape/rules, certificate expiry metric và monitoring README.
- [x] Evidence, intake form, manifest và production execution runbook.
- [x] Đã chạy baseline/soak/spike staging bằng synthetic PDF; kết quả p50/p95/p99, throughput và HTTP 429 đã lưu trong PG-11 status.

- Staging/test: đã có PAdES signing, tamper validation, readiness fail-closed, size guard, metrics và Prometheus rules.
- Production: chưa đánh dấu đạt cho đến khi có HSM/USB Token/Remote CA thật, trust chain CA, TSA/OCSP/CRL và biên bản nghiệm thu liên phòng ban.
- Đầu vào bắt buộc còn thiếu: vendor/provider được phê duyệt, endpoint hoặc PKCS#11 library, trust chain CA, TSA/OCSP/CRL endpoint và SLA ký số.
- Mẫu thu thập đầu vào: `SIGNING_PROVIDER_INTAKE_FORM.md`.
- Mẫu manifest evidence: `PG11_EVIDENCE_MANIFEST_TEMPLATE.md`.
- Runbook thực hiện khi đủ provider input: `PRODUCTION_PROVIDER_EXECUTION_RUNBOOK.md`.
- Bản trạng thái ngày 13/08/2026: `PG11_STATUS_2026-08-13.md`.
- Bảng theo dõi blocker production: `PG11_PRODUCTION_BLOCKER_TRACKER.md`.
- Evidence index: `PG11_EVIDENCE_INDEX.md`.
- Decision record: `PG11_DECISION_RECORD.md`.
