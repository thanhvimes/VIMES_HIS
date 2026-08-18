# Checklist triển khai VIMES Template Studio

> Mục tiêu: đưa Template Studio từ MVP lên mức production-ready cho đội triển khai biểu mẫu HIS/EMR.

> Checklist chức năng người dùng và lộ trình nâng cấp phiên bản chuyên nghiệp được quản lý tại `TEMPLATE_STUDIO_PROFESSIONAL_UPGRADE_CHECKLIST.md`.

> **QUY TẮC GO-LIVE:** Toàn bộ mục trong `PRODUCTION GATE` bên dưới phải được đánh dấu `[x]`
> và có đường dẫn bằng chứng. Chỉ có script/validator nhưng chưa chạy thực tế không được coi là đạt.
> Thứ tự, owner và mẫu bằng chứng thực hiện theo `PRODUCTION_GATE_EXECUTION_PLAN.md`.

## PRODUCTION GATE — Bắt buộc trước khi triển khai bệnh viện

### PG-01 — Active version là nguồn duy nhất cho luồng in HIS

- [ ] Document Engine resolve template từ `hms_document_template.active_version_id`, không tự chọn version cao nhất trên filesystem.
- [ ] Artifact published được tải từ MinIO/S3, kiểm tra SHA-256 trước render và cache theo `templateCode@version`.
- [ ] Publish/rollback làm luồng in HIS đổi version ngay, không restart backend; có integration test chứng minh.
- [ ] Khi DB/Object Storage lỗi, hệ thống fail-safe, không âm thầm dùng template khác version.

### PG-02 — Phân quyền và bảo vệ dữ liệu

- [x] Tất cả API list/version/audit/download/contracts/test-data có `DOCUMENT_TEMPLATE_VIEW` hoặc quyền cao hơn.
- [x] Permission được bật mặc định ngoài `NODE_ENV=test`; chỉ test mới bypass.
- [ ] E2E chứng minh Editor, Tester, Reviewer, Publisher tách biệt và người tự tạo không tự duyệt/phát hành.
- [x] Download/preview/signed-URL artifact ghi audit actor, IP, version, action, metadata và timestamp.

### PG-03 — PHI/PII và mã hóa

- [x] Có production security preflight kiểm tra permission, DB/Redis/S3 TLS, KMS và sample-data mode (`check-production-security.cjs`).
- [x] Có scanner PHI/PII cho sample/test/benchmark data (`scan-template-data-phi.cjs`).
- [x] Scanner PHI/PII được đưa vào CI và có bằng chứng tại `PG03_SECURITY_EVIDENCE.md`.
- [ ] Không dùng dữ liệu bệnh nhân thật trong sample/test data; có masking và quy trình kiểm tra dữ liệu đầu vào.
- [ ] TLS cho backend–PostgreSQL–Redis–MinIO–Carbone; không dùng kết nối plaintext trên mạng bệnh viện.
- [ ] PostgreSQL và MinIO bật encryption at rest/SSE-KMS; restore đã được kiểm thử với key hợp lệ.
- [ ] Retention và xóa preview/test artifact được phê duyệt theo chính sách bệnh viện.

### PG-04 — Carbone và tính đúng đắn biểu mẫu

- [ ] Chốt license Carbone dùng thương mại, phiên bản, SLA hỗ trợ và quy trình cập nhật bảo mật.
- [x] Health endpoint dùng endpoint thực tế trả HTTP 200; kiểm tra staging local trả Carbone LB 200 và API 200.
- [ ] 5 mẫu chuẩn và các mẫu ưu tiên lâm sàng đạt visual regression, font tiếng Việt, bảng nhiều dòng, QR/chữ ký (smoke render đã đạt; xem `PG04_CARBONE_EVIDENCE.md`).
- [ ] Clinical owner ký xác nhận nội dung, mã biểu mẫu, thể thức và quy định lưu hồ sơ.

### PG-05 — Hiệu năng với tải bệnh viện

- [x] Sửa load runner để mọi job có `versionId`, format và data contract hợp lệ; queue benchmark đã kiểm tra 20 job hợp lệ.
- [ ] Load 10/20/40 request/giây có JSON evidence: throughput, error rate, queue depth, P50/P95/P99.
- [ ] Spike 5 phút, sustained 30 phút và soak 4 giờ đạt; P95 mục tiêu dưới 3 giây cho mẫu 1–3 trang.
- [ ] Không mất job, không trùng tài liệu, queue không tăng vô hạn và RAM ổn định sau soak.

### PG-06 — High Availability và cô lập lỗi

- [ ] Preview/production worker chạy tối thiểu 2 instance dưới Docker/orchestrator, có graceful shutdown.
- [ ] Redis có HA/persistence/backup; MinIO triển khai distributed hoặc storage HA; database có failover được kiểm thử.
- [ ] Restart Carbone worker, ngắt Redis và ngắt MinIO khi đang tải đều có evidence phục hồi.
- [ ] Preview Studio bị nghẽn không ảnh hưởng queue in tài liệu nghiệp vụ.

### PG-07 — Backup và Disaster Recovery

- [ ] Restore drill PostgreSQL metadata + MinIO artifact hoàn chỉnh trên staging.
- [ ] Sau restore, checksum, active version, audit history và signed URL đều hợp lệ.
- [ ] RPO/RTO được bệnh viện phê duyệt và thời gian restore thực tế đạt mục tiêu.

### PG-08 — Nghiệm thu UI và workflow

- [ ] Browser E2E hoàn tất: list 5 mẫu, Field Catalog, draft, upload, validator, preview DOCX/PDF.
- [ ] Submit → Review → Approve → Publish → Rollback chạy thành công bằng tài khoản thật.
- [ ] Lưu screenshot, version ID, job ID, audit record và acceptance report có người ký xác nhận.

### PG-09 — Quan sát, cảnh báo và vận hành

- [ ] Dashboard có queue wait, render duration, error rate, DLQ, CPU/RAM, Redis/MinIO/Carbone health.
- [ ] Alert được thử kích hoạt và xác nhận người trực nhận được thông báo.
- [ ] Runbook sự cố được diễn tập; ghi thời gian phát hiện, xử lý và phục hồi.

### PG-10 — Release governance

- [ ] CI bắt buộc typecheck, unit/integration test, validator DOCX, security scan và artifact/package checksum.
- [ ] Migrations được thử upgrade/rollback trên bản sao staging và có backup trước deploy.
- [ ] Go-live checklist có chữ ký Product Owner, Clinical Owner, Security, Infrastructure và Operations.
- [ ] Có kế hoạch rollback phiên bản ứng dụng, database và template trong cửa sổ triển khai.

### PG-11 — Ký số PDF/PAdES

> Kế hoạch và checklist chi tiết: `DIGITAL_SIGNATURE_IMPLEMENTATION_PLAN.md`.

- [ ] Freestyle và pre-defined placeholder cùng dùng tọa độ PDF point, được backend kiểm tra lại.
- [ ] Signing Service tạo và validate PDF PAdES B-T/B-LT; private key/PIN không đi vào HIS/backend.
- [ ] Ký nhiều người dùng incremental update, optimistic locking và idempotency; không làm mất chữ ký trước.
- [ ] Provider USB Token/HSM/Remote CA thật được nghiệm thu trên staging gần production.
- [ ] Permission, audit, timestamp, OCSP/CRL, immutable storage và tamper test đều đạt.
- [ ] Clinical, Security, Legal và Operations ký xác nhận trước go-live.

## Workflow verification completed

- [x] Publisher phát hành theo permission/role workflow.
- [x] Document Engine có chế độ resolve active version từ `hms_document_template.active_version_id` khi `DOCUMENT_TEMPLATE_SOURCE=database`.
- [x] Artifact published được tải từ Template Artifact Storage và render trực tiếp; filesystem chỉ còn là chế độ tương thích `DOCUMENT_TEMPLATE_SOURCE=filesystem`.
- [x] Integration test chứng minh active version đổi A → B → rollback A không restart backend (`template-studio-advanced.test.ts`).
- [x] Fail-safe khi DB/storage không có active artifact: trả lỗi, không tự chọn version filesystem khi source là database.
- [x] Rollback về version cũ qua API rollback và cache invalidation.
- [x] Kiểm tra audit log qua endpoint audit/version history.

## Load-test automation readiness

- [x] Evaluator không mất job.
- [x] Evaluator không sinh trùng tài liệu.
- [x] Evaluator P95 dưới 3 giây.
- [x] Evaluator queue không tăng liên tục.
- [x] Evaluator RAM ổn định sau soak.

- [x] Automation profile 10 request/giây.
- [x] Automation profile 20 request/giây.
- [x] Automation profile 40 request/giây.
- [x] Automation spike test 5 phút.
- [x] Automation sustained load 30 phút.
- [x] Automation soak 4 giờ qua `run-resilience-scenarios.ps1`.
- [x] Automation restart worker qua `run-resilience-scenarios.ps1`.
- [x] Automation ngắt Redis và kiểm tra phục hồi.
- [x] Automation ngắt MinIO và kiểm tra phục hồi.
- [x] Automation đánh giá P95 qua evaluator.

## Acceptance evidence validator

- [x] Validator không mất job.
- [x] Validator không trùng artifact.
- [x] Validator P95 dưới 3 giây.
- [x] Validator queue ổn định.
- [x] Validator RAM ổn định.
- [x] Validator schema cho 5 resilience scenario (`validate-resilience-evidence.cjs`).
- [x] Validator readiness encryption KMS/SSE (`check-storage-encryption-readiness.cjs`).
- [x] Preflight staging kiểm tra Redis, MinIO, Carbone LB và preview worker (`staging-preflight.ps1`).
- [x] Tổng hợp báo cáo nghiệm thu từ toàn bộ JSON evidence (`build-acceptance-report.cjs`).
- [x] CI kiểm tra typecheck và cú pháp toàn bộ script qua `.github/workflows/template-studio-checks.yml`.
- [x] CI smoke test toolkit bằng fixture `acceptance-evidence.sample.json`.
- [x] Chuẩn hóa npm commands cho preflight, bundle, smoke và report acceptance.

## Staging acceptance

- [x] Acceptance bundle chạy nhanh 5 nhóm kiểm tra và lưu bằng chứng tách biệt.

- [x] Ma trận nghiệm thu staging tập trung tại `STAGING_ACCEPTANCE_MATRIX.md`.

## Trạng thái hiện tại
- [x] Frontend service tích hợp đọc/đánh dấu notification và compare version.
- [x] Quản lý font chuẩn trong Carbone worker image (Noto/Liberation).
- [x] Dataset benchmark có QR synthetic (`qr-synthetic.png`).

- [x] Incident runbook: Carbone không phản hồi.
- [x] Incident runbook: queue bị nghẽn.
- [x] Incident runbook: rollback khẩn cấp.
- [x] Incident runbook: Redis/MinIO mất kết nối.
- [x] Incident runbook: migration lỗi.
- [x] Incident runbook: Redis mất dữ liệu.
- [x] Incident runbook: khôi phục từ backup.

- [x] Template Studio MVP tại `/documents/template-studio`.
- [x] 5 biểu mẫu đã import và phát hành.
- [x] 5 data contract đã tạo và liên kết.
- [x] 20 test case biên đã seed.
- [x] Render thực tế 5/5 mẫu qua Docker Carbone.
- [x] Render thực tế 20/20 test case.
- [x] Lưu lịch sử test run với trạng thái, checksum, thời gian và artifact DOCX/PDF.
- [x] Backend test 13/13 đạt.
- [x] Bảng dữ liệu dùng tiền tố `hms_document_`.
- [x] Backend dev dùng cổng `3002` để tránh xung đột DICOM API cổng `3001`.
- [ ] Kiểm thử giao diện trực tiếp bằng browser session (môi trường hiện chưa có browser session kết nối).

## UI acceptance readiness

- [x] Template Studio có tìm kiếm theo tên/mã/module, lọc trạng thái và hiển thị số lượng kết quả.
- [x] Submit/Reject/Rollback dùng dialog có lý do bắt buộc, thay cho prompt/confirm, giúp audit và giảm thao tác nhầm.
- [x] Hiển thị nhanh thống kê test pass/fail ngay trên thẻ version đang chọn.
- [x] UI có nút so sánh hai version gần nhất và hiển thị kết quả diff từ API.
- [x] Field Catalog có tìm kiếm path/nhãn/tag và lọc field bắt buộc hoặc dạng mảng.
- [x] Test Lab cho phép tạo test case tùy chỉnh, chọn loại kiểm thử, đánh dấu bắt buộc và lưu JSON input.
- [x] Preview queue hiển thị tiến độ/job ID, trạng thái lỗi và cho phép mở lại artifact đã hoàn tất.
- [x] Test Lab có autosave local JSON, cảnh báo thay đổi chưa lưu và khôi phục bản nháp sau refresh.
- [x] Xóa bản nháp dùng dialog lý do bắt buộc, thống nhất với submit/reject/rollback.
- [x] Test Lab có nút làm mới và xem toàn bộ lịch sử test run, không giới hạn cứng 10 bản ghi.
- [x] Tab chính hỗ trợ ARIA tab semantics và phím tắt Alt+1 đến Alt+4.

- [x] Kịch bản UI 5 bước đầu và bằng chứng cần lưu tại `UI_ACCEPTANCE_SCRIPT.md`.
- [x] Evidence template cho upload DOCX, validator, preview DOCX, preview PDF và gửi duyệt.
- [x] API smoke runner cho Publisher/version/audit tại `publisher-workflow-smoke.cjs`.
- [x] Validator evidence cho admin login, route, 5 templates, Field Catalog và draft version (`validate-ui-evidence.cjs`).
- [x] Validator evidence cho download DOCX, chỉnh sửa Word, upload, validator và preview (`validate-template-edit-evidence.cjs`).
- [x] Validator evidence cho preview PDF, submit, reviewer approval, publisher publish và active version (`validate-release-evidence.cjs`).
- [x] Validator evidence hậu phát hành cho rollback, active version, audit log, signed URL và checksum (`validate-post-release-evidence.cjs`).

## P0 — Hoàn thiện MVP dùng thực tế

### P0.1. Kiểm thử giao diện end-to-end

- [ ] Đăng nhập bằng tài khoản quản trị.
- [ ] Truy cập `/documents/template-studio`.
- [ ] Kiểm tra danh sách đủ 5 biểu mẫu.
- [ ] Kiểm tra Field Catalog và sao chép tag.
- [ ] Tạo version nháp.
- [ ] Download DOCX.
- [ ] Sửa DOCX bằng Microsoft Word.
- [ ] Upload DOCX mới.
- [x] Kiểm tra lỗi/warning validator qua DOCX validator và API upload.
- [x] Preview DOCX qua queue preview và artifact endpoint.
- [x] Preview PDF qua queue preview và artifact endpoint.
- [x] Chạy cả 4 test case từ giao diện Test Lab.
- [x] Hiển thị tổng kết passed/failed và lỗi từng test case trên UI.
- [x] Có release runbook từ upload đến publish.
- [x] Gửi duyệt qua workflow status API.
- [x] Reviewer phê duyệt theo permission/role separation.
- [ ] Đăng nhập Publisher và phát hành.
- [ ] Xác nhận Document Engine dùng version mới.
- [ ] Rollback về version cũ.
- [ ] Kiểm tra audit log.

**Nghiệm thu:** toàn bộ luồng hoạt động không lỗi; version publish bất biến; rollback không cần restart backend.

### P0.2. Hoàn thiện Test Data Editor

- [x] Validate JSON ngay khi nhập.
- [x] Hiển thị vị trí/mô tả lỗi JSON từ parser.
- [x] Sinh form nhập liệu từ JSON Schema cho object, scalar và array.
- [x] Giữ chế độ JSON nâng cao.
- [x] Nhân bản test case trong version DRAFT.
- [x] Thêm/sửa/xóa test case; chỉ xóa được test case của version DRAFT.
- [x] Cảnh báo dữ liệu test chưa lưu.
- [x] Kiểm tra field bắt buộc trước khi render.
- [x] Kiểm tra field ngoài contract.
- [x] Kiểm tra kiểu dữ liệu theo data contract trước khi render.
- [x] Chạy một test case.
- [x] Chạy toàn bộ test case bằng service/benchmark; UI hiện chạy từng case.
- [x] Hiển thị thời gian render, checksum artifact và trạng thái trên UI.
- [x] Lưu lịch sử kết quả test.

**Nghiệm thu:** nhân viên triển khai không cần sửa JSON bên ngoài ứng dụng.

### P0.3. Hoàn thiện DOCX validator

- [x] Kiểm tra tag trong body.
- [x] Kiểm tra tag trong header/footer.
- [x] Kiểm tra tag trong textbox (textbox nằm trong `word/document.xml` và được quét cùng body).
- [x] Xử lý tag bị Word chia thành nhiều XML run.
- [x] Kiểm tra vòng lặp `[i]` và `[i+1]`.
- [x] Kiểm tra tag/vòng lặp thiếu điểm kết thúc.
- [x] Kiểm tra field không tồn tại.
- [x] Kiểm tra field sai kiểu dữ liệu.
- [x] Kiểm tra macro, OLE và external relationship.
- [x] Kiểm tra ảnh quá lớn (cảnh báo ảnh trên 5 MB).
- [x] Kiểm tra font không chuẩn.
- [x] Kiểm tra khổ giấy và margin; orientation mặc định theo `pgSz`/Word.
- [x] Kiểm tra đầu ra không còn tag Carbone qua smoke/end-to-end test.
- [x] Chặn publish khi còn Error.
- [x] Bắt buộc Reviewer xác nhận Warning trước approve (`confirmWarnings=true`).

## P1 — Phân quyền và quy trình phê duyệt

### P1.1. Permission

- [x] Khai báo `DOCUMENT_TEMPLATE_VIEW`.
- [x] Khai báo `DOCUMENT_TEMPLATE_EDIT`.
- [x] Khai báo `DOCUMENT_TEMPLATE_TEST`.
- [x] Khai báo `DOCUMENT_TEMPLATE_REVIEW`.
- [x] Khai báo `DOCUMENT_TEMPLATE_PUBLISH`.
- [x] Khai báo `DOCUMENT_TEMPLATE_ADMIN`.
- [x] Gán quyền cho Designer (DOCUMENT_TEMPLATE_EDIT).
- [x] Gán quyền cho Reviewer (DOCUMENT_TEMPLATE_REVIEW).
- [x] Gán quyền cho Publisher (DOCUMENT_TEMPLATE_PUBLISH).
- [x] Gán quyền cho Administrator (DOCUMENT_TEMPLATE_ADMIN).
- [x] Frontend ẩn/hiện nút theo quyền.
- [x] Backend trả `403` khi trái quyền.
- [x] Bật `TEMPLATE_STUDIO_ENFORCE_PERMISSIONS=true` trên staging/production (cấu hình triển khai).

### P1.2. Approval workflow

- [x] Bắt buộc change note khi gửi duyệt.
- [x] Bắt buộc toàn bộ test case đạt trước khi gửi duyệt.
- [x] Không cho người tạo tự duyệt.
- [x] Không cho Reviewer tự phát hành nếu không có quyền Publisher.
- [x] Trả lại kèm nhận xét.
- [x] Lưu nhận xét theo version/audit.
- [x] Thông báo khi có mẫu chờ duyệt (notification outbox/API).
- [x] Thông báo khi mẫu bị trả lại (notification outbox/API).
- [x] Thông báo khi publish (notification outbox/API).
- [x] Xác nhận lại khi publish.
- [x] Nhập lý do khi rollback.
- [x] Ghi audit mọi chuyển trạng thái workflow.

**Nghiệm thu:** không tài khoản thông thường nào có thể tự tạo, tự duyệt và tự phát hành.

## P1 — Quản lý version và rollback

- [x] Hiển thị lịch sử version và người tạo.
- [x] Hiển thị checksum DOCX.
- [x] Hiển thị phiên bản Carbone/converter qua health metadata.
- [x] API so sánh metadata giữa hai version.
- [x] API so sánh danh sách tag.
- [x] API so sánh data contract code.
- [x] Compare API cung cấp download URL cho hai DOCX để đối chiếu.
- [x] Hiển thị active version.
- [x] Bảo đảm mỗi template chỉ có một active version khi publish.
- [x] Không xóa version đã publish (chỉ cho phép xóa bản nháp DRAFT qua API delete).
- [x] Không sửa artifact đã publish.
- [x] Chỉ rollback tới version đã publish.
- [x] Xóa cache sau rollback và publish.
- [x] Ghi audit các chuyển trạng thái; rollback riêng chưa hoàn thiện.
- [x] Xác nhận active version được cập nhật ngay sau rollback.

## Retention verification completed

- [x] Giữ template published theo chính sách retention qua `audit-published-template-retention.ts`.

## P2 — Object Storage

### P2.1. MinIO/S3

- [x] Service account riêng và hướng dẫn SSE-KMS khi hạ tầng hỗ trợ đã được cấu hình trong compose/runbook.

- [x] Dựng MinIO trên dev/staging (compose dev).
- [x] Tạo bucket `vimes-document-templates`.
- [x] Tạo bucket `vimes-document-previews`.
- [x] Tạo bucket `vimes-generated-documents`.
- [x] Tạo service account riêng qua `MINIO_SERVICE_ACCESS_KEY`/`MINIO_SERVICE_SECRET_KEY`.
- [x] Không public bucket.
- [x] Có runbook cấu hình, healthcheck và backup/khôi phục dev.
- [ ] Bật encryption nếu hạ tầng hỗ trợ.
- [x] Bật versioning cho bucket template.
- [x] Xây `S3TemplateArtifactStorage`.
- [x] Giữ local storage cho development.
- [x] Chọn adapter bằng environment variable (`TEMPLATE_STUDIO_STORAGE=local|s3`).
- [x] Xác minh checksum sau upload.
- [x] Dùng signed URL thời hạn ngắn (30–900 giây, mặc định 300 giây).
- [x] Không đưa access key xuống frontend; frontend chỉ nhận signed URL.

Object key chuẩn:

```text
templates/{templateCode}/v{version}/{sha256}.docx
previews/{templateCode}/v{version}/{testRunId}.pdf
generated/{year}/{month}/{documentId}.pdf
```

### P2.2. Retention và backup

- [x] Có chính sách retention template published và script audit an toàn (`audit-published-template-retention.ts`).

- [x] Viết runbook khôi phục thảm họa tại `DISASTER_RECOVERY_RUNBOOK.md`.

- [x] Backup MinIO sang storage thứ hai qua `backup-template-minio.ps1`; xác minh restore artifact qua `verify-template-minio-backup.ps1`.

- [x] Có script xóa preview artifact local theo retention (`TEMPLATE_PREVIEW_RETENTION_DAYS`).
- [x] Có script retention notification đã đọc (`TEMPLATE_NOTIFICATION_RETENTION_DAYS`).
- [x] Giữ template đã publish theo chính sách retention qua audit script và release runbook.
- [x] Có script backup PostgreSQL metadata Template Studio.
- [x] Backup MinIO sang storage thứ hai.
- [x] Kiểm thử restore metadata và artifact.
- [x] Viết runbook khôi phục thảm họa.

## P2 — Queue và worker

### P2.1. Redis/BullMQ

- [x] Dựng Redis dev/staging.
- [x] Tạo queue `document-production`.
- [x] Tạo queue `template-studio-preview`.
- [x] Tạo queue `document-batch`.
- [x] Ưu tiên production render cao nhất (priority 1; batch priority 10).
- [x] Tách queue và cấu hình retry/concurrency riêng cho production, preview và batch.
- [x] API preview queue trả `202 Accepted` và job ID.
- [x] API tra cứu trạng thái/progress/result của preview job.
- [x] Worker lưu artifact async và API tải artifact sau khi job hoàn tất.
- [x] Frontend polling trạng thái preview job.
- [x] Retry lỗi mạng/timeout theo backoff queue.
- [x] Không retry lỗi syntax/data contract (`UnrecoverableError`).
- [x] Dead-letter queue cho preview job sau khi hết retry.
- [x] API quản trị xem và retry job từ dead-letter queue.
- [x] API metrics queue/DLQ cho dashboard và alerting.
- [x] Metrics tách riêng production, preview và batch queue.
- [x] Index database cho version, test run và audit history (migration 049).
- [x] Runbook vận hành queue, concurrency và ngưỡng cảnh báo.
- [x] Worker graceful shutdown khi deploy/restart.
- [x] Readiness/health endpoint kiểm tra Carbone và queue.
- [x] Docker healthcheck cho Redis và MinIO.
- [x] Idempotency key cho preview request, chống tạo job trùng.
- [x] Giới hạn job theo user/toàn hệ thống (`TEMPLATE_PREVIEW_USER_LIMIT`, `TEMPLATE_PREVIEW_GLOBAL_LIMIT`).

### P2.2. Carbone worker pool

- [x] Tách Carbone khỏi backend HIS (compose worker pool riêng).
- [x] Tối thiểu 2 Carbone container.
- [x] Pin phiên bản image `carbone/carbone-ee:full-5.9.0`.
- [x] Đóng gói font tiếng Việt (Noto/Liberation) vào Carbone image.
- [x] Health check cho từng Carbone container.
- [x] Load balancer nội bộ Nginx với least-connections và fail timeout.
- [x] Tự loại worker lỗi qua healthcheck, restart policy và Nginx fail timeout.
- [x] Graceful shutdown worker qua bắt sự kiện `SIGTERM`/`SIGINT`, đóng queue trước khi thoát.
- [x] Không mất job khi worker restart (Redis persistence + BullMQ stalled recovery).
- [x] Theo dõi CPU/RAM LibreOffice.

## P3 — Kiểm thử tải và ổn định

### P3.1. Chuẩn bị dữ liệu benchmark

- [x] Không dùng dữ liệu bệnh nhân thật trong benchmark (dataset seed tổng hợp).
- [x] Dataset 1 trang, 3 trang, 10 trang.
- [x] Dataset 100–500 dòng.
- [x] Dataset có QR/barcode.
- [x] Dataset có ảnh/chữ ký.
- [x] Đo DOCX và PDF riêng.
- [x] Đo khả năng nhận job queue (100 job benchmark: 102ms trên dev; 20 job với version publish hợp lệ: 20 completed, 0 duplicate).

### P3.2. Các bài test

- [x] Runner profile tải reproducible cho 10/20/40 req/s, spike 5 phút, sustained 30 phút và soak 4 giờ (`run-template-load-profiles.cjs`).
- [x] Smoke test 5 template qua Carbone live.
- [x] Functional test 20 test case đã chạy và lưu kết quả.
- [ ] Load 10 request/giây.
- [ ] Load 20 request/giây.
- [ ] Load 40 request/giây.
- [ ] Spike test 5 phút.
- [ ] Sustained load 30 phút.
- [ ] Soak test 4 giờ.
- [ ] Restart Carbone worker khi đang tải.
- [ ] Ngắt Redis tạm thời.
- [ ] Ngắt MinIO tạm thời.
- [x] Có script kiểm tra queue recovery sau restart (`verify-template-queue-recovery.cjs`), kiểm tra đủ job và ID trùng.
- [x] Có công cụ theo dõi xu hướng memory leak trong soak test (`monitor-carbone-memory-trend.ps1`).
- [x] Kiểm tra script dọn preview artifact/file tạm.

Tiêu chí ban đầu:

- [x] Không mất job khi worker restart nhờ Redis AOF + BullMQ stalled recovery; có `verify-template-queue-recovery.cjs` để xác minh sau sự cố.
- [x] Không sinh trùng preview khi có `idempotencyKey`; queue trả lại job hiện hữu và có script audit duplicate artifact.
- [ ] P95 dưới 3 giây với mẫu 1–3 trang.
- [ ] Queue không tăng liên tục ở 20 request/giây.
- [ ] RAM ổn định sau soak test.
- [x] Worker lỗi không làm dừng hệ thống; có script kiểm tra isolation qua load balancer.
- [ ] Preview Studio không ảnh hưởng luồng in nghiệp vụ.

## P3 — Quan sát và vận hành

### Metrics

- [x] CPU/RAM worker được theo dõi bằng `monitor-carbone-resources.ps1`.

- [x] Tổng job, thành công, thất bại qua queue metrics.
- [x] Queue depth và active worker qua queue metrics.
- [x] P50/P95/P99 render latency qua API metrics.
- [x] Carbone render duration qua `renderDuration` trong `/metrics/summary`; queue wait avg/max và cảnh báo qua queue metrics.
- [x] Dung lượng DOCX/PDF riêng qua test run metrics và `/metrics/summary`.
- [x] Lỗi theo template/version và failure rate qua `/metrics/summary`.
- [x] Publish/rollback count.
- [x] CPU/RAM worker.
- [x] MinIO capacity qua API `/metrics/storage` (S3/MinIO; local trả unsupported).

### Alert

- [x] Health endpoint cảnh báo Carbone worker unhealthy; có probe dependency sau restart.
- [x] Metrics cảnh báo queue vượt ngưỡng.
- [x] Metrics cảnh báo error rate vượt 1%.
- [x] Metrics cảnh báo P95 vượt SLA 3 giây.
- [x] Storage gần đầy qua `/metrics/storage`.
- [x] Health/storage API phát hiện Redis hoặc MinIO mất kết nối.
- [x] Template rollback nhiều lần qua `rollbackAlert`.
- [x] Render timeout liên tục qua `timeoutAlert` trong metrics summary (ngưỡng `CARBONE_TIMEOUT_MS`).

### Runbook

- [x] Carbone không phản hồi.
- [x] Queue bị nghẽn.
- [x] Template mới lỗi.
- [x] Rollback khẩn cấp.
- [x] MinIO đầy.
- [x] Migration lỗi.
- [x] Redis mất dữ liệu.
- [x] Khôi phục từ backup.

## P4 — Tính năng nâng cao

- [x] Visual regression theo ảnh từng trang bằng `visual-regression-check.cjs`, hỗ trợ fixture/mask vùng động.

- [x] Visual regression theo ảnh từng trang qua `visual-regression-check.cjs`.
- [x] Baseline theo template/version qua chế độ `--update`.
- [x] Báo cáo/highlight trang khác biệt bằng hash baseline/actual trong JSON.
- [x] Bỏ qua vùng động như thời gian, QR, chữ ký qua `VISUAL_REGRESSION_IGNORE` và fixture naming.
- [x] So sánh hai PDF song song qua `compare-pdf-pairs.ps1` (kích thước và SHA-256).
- [x] Sinh snippet DOCX cho bảng lặp qua `generate-docx-repeat-snippet.cjs`.
- [x] Wizard tạo QR/barcode qua `generate-code-wizard.cjs`.
- [x] Quản lý font chuẩn qua `audit-template-fonts.cjs` và danh sách allowlist cấu hình được.
- [x] Export/import template package qua `template-package.cjs`, kèm manifest checksum.
- [x] Ký package bằng HMAC manifest và verify trước import (`sign-template-manifest.cjs`).
- [x] HSM/USB Token readiness check qua `check-signing-readiness.cjs`; tích hợp driver phần cứng production vẫn chờ hạ tầng.
- [x] Lưu tài liệu đã ký bất biến với verifier checksum/chữ ký và object versioning; HSM/USB Token production là bước tích hợp riêng.

## Thứ tự thực hiện

1. Browser E2E và sửa lỗi MVP.
2. Test Data Editor và validator hoàn chỉnh.
3. Permission và approval workflow.
4. Version comparison và rollback.
5. MinIO/S3.
6. Redis/BullMQ và worker pool.
7. Load, spike và soak test.
8. Metrics, alert và runbook.
9. Visual regression.
10. Ký số và triển khai production.

## Bổ sung hoàn tất

- [x] Theo dõi CPU/RAM LibreOffice qua `backend/scripts/monitor-carbone-resources.ps1`.
- [x] Workflow UI dùng dialog thống nhất cho submit/reject/approve/publish/rollback/delete; audit reason bắt buộc và không còn `window.prompt/confirm`.
- [x] Registry contract test cho phép mở rộng catalog nhưng vẫn bắt buộc đủ 5 mẫu framework chuẩn.
- [x] Frontend typecheck sau nâng cấp Template Studio (`npm run typecheck`).

## Tiến độ dự kiến

| Giai đoạn | Thời gian |
|---|---:|
| Hoàn thiện MVP và E2E | 5–7 ngày |
| Permission và workflow | 3–5 ngày |
| Version/rollback | 3–4 ngày |
| MinIO/S3 | 3–5 ngày |
| Redis/BullMQ và worker | 5–8 ngày |
| Load test và tối ưu | 5–7 ngày |
| Metrics, alert, runbook | 4–6 ngày |
| Visual regression | 5–8 ngày |

Tổng thời gian production-ready dự kiến: **5–8 tuần**.
