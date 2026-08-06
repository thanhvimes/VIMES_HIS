# Kế hoạch xây dựng VIMES Template Studio

## Trạng thái triển khai MVP (04/08/2026)

Đã hoàn thành lát cắt nền móng:

- Migration `047_create_document_template_studio.sql` cho template, version, contract, test case/run và audit.
- Local artifact storage adapter với object key an toàn và ghi file atomic.
- DOCX/OpenXML validator: signature, giới hạn kích thước, ZIP traversal/bomb, macro/OLE, field catalog và tag Carbone.
- Contract catalog cho 5 mẫu hiện tại, bao gồm trường lặp dạng `items[]`/`entries[]`.
- API danh sách, tạo/clone version, upload/download, sample data, preview DOCX/PDF và workflow.
- Quyền Template Studio được bắt buộc trong production; development có thể bật bằng biến môi trường.
- Lệnh idempotent import 5 mẫu hiện tại: `npm run seed:template-studio`.
- Frontend tại `/documents/template-studio`: danh sách, field catalog, upload, download, preview và workflow.
- Test Lab có JSON editor, lựa chọn kịch bản, preview bằng dữ liệu đang sửa và lưu sample data cho Draft.
- Chi tiết validation error/warning, lịch sử version và audit timeline đã có trên workspace.
- UI ẩn/hiện hành động theo `DOCUMENT_TEMPLATE_*`; backend luôn bắt buộc permission ở production.
- Mỗi mẫu có 4 test case bắt buộc: normal, long text, empty optional và 100 rows (tổng 20 case).
- Unit test validator/storage/contract cùng test hồi quy Document Engine.
- Migration 047 đã áp dụng trên DB dev `vimes_nb`; 5 template và 5 data contract đã được import, liên kết và phát hành.

Quy ước CSDL: toàn bộ bảng thuộc Document Engine/Template Studio dùng tiền tố `hms_document_`. Index và foreign-key constraint mới cũng dùng cùng tiền tố để dễ nhận diện, phân quyền, backup và quy hoạch schema sau này.

### Khởi tạo trên dev/staging

Không chạy các bước sau nếu `.env` đang trỏ tới production.

1. Khởi động backend để migration runner áp dụng migration 047.
2. Tại thư mục `backend`, chạy `npm run seed:template-studio` để import 5 mẫu.
3. Đảm bảo Carbone chạy ở `CARBONE_URL`.
4. Mở `/documents/template-studio` bằng staff account.

Trong workspace dev hiện tại, backend dùng cổng `3002` vì container `dicom_web_api_v2` đang publish cổng `3001`. Vite proxy đọc `VITE_API_PROXY_TARGET`, mặc định `http://localhost:3002`.

Production phải cấp một hoặc nhiều permission: `DOCUMENT_TEMPLATE_EDIT`, `DOCUMENT_TEMPLATE_TEST`, `DOCUMENT_TEMPLATE_REVIEW`, `DOCUMENT_TEMPLATE_PUBLISH`, `DOCUMENT_TEMPLATE_ADMIN`.

## 1. Mục tiêu

Template Studio là công cụ nội bộ cho đội triển khai biểu mẫu. Người dùng tiếp tục thiết kế bố cục bằng Microsoft Word hoặc LibreOffice; hệ thống chịu trách nhiệm quản lý trường dữ liệu, tải mẫu, kiểm tra, render thử, phê duyệt, phát hành và rollback.

Không xây trình soạn thảo DOCX trên web trong giai đoạn này. Quyết định này giúp giữ nguyên độ chính xác của bảng, header/footer, section, khổ giấy và ngắt trang, đồng thời giảm đáng kể thời gian phát triển.

## 2. Hiện trạng có thể tái sử dụng

- `CarboneRenderer` đã gọi được Carbone v5 và sinh DOCX/PDF thực tế.
- `TemplateRegistry` đang đọc các phiên bản `published` từ filesystem.
- `DocumentService` đã có giới hạn dữ liệu, gộp request trùng và capacity limiter.
- Đã có 5 template khung cùng `manifest.json` và `sample-data.json`.
- Frontend đã có `apiClient`, layout, sidebar, bảng dữ liệu, modal và PDF preview.
- JWT đã mang `userId`, `permissions`, `groupId` và `deptId`.

Khoảng trống hiện tại:

- Chưa có Draft/Review/Published/Retired trong cơ sở dữ liệu.
- Chưa có upload, download, clone version, approval và rollback API.
- Chưa có data contract/field catalog có phiên bản.
- Chưa kiểm tra cú pháp Carbone và cấu trúc DOCX trước khi render.
- Chưa lưu test run, checksum, audit trail và artifact preview.
- Registry filesystem chưa phù hợp khi chạy nhiều backend instance.

## 3. Người dùng và phân quyền

| Vai trò | Quyền chính |
|---|---|
| Template Designer | Tạo mẫu, clone phiên bản, tải DOCX, sửa dữ liệu test, chạy kiểm thử |
| Template Reviewer | Xem kết quả test, nhận xét, duyệt hoặc trả lại |
| Template Publisher | Phát hành, retire, rollback |
| Template Administrator | Quản lý data contract, field catalog, font và cấu hình hệ thống |

Permission đề xuất:

- `DOCUMENT_TEMPLATE_VIEW`
- `DOCUMENT_TEMPLATE_EDIT`
- `DOCUMENT_TEMPLATE_TEST`
- `DOCUMENT_TEMPLATE_REVIEW`
- `DOCUMENT_TEMPLATE_PUBLISH`
- `DOCUMENT_TEMPLATE_ADMIN`

Nguyên tắc: phiên bản đã phát hành là bất biến; người tạo không tự duyệt/phát hành trong cấu hình production.

## 4. Vòng đời biểu mẫu

```text
DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> RETIRED
   ^         |
   +---------+ REJECTED/RETURNED
```

- Chỉ `DRAFT` được thay file và dữ liệu test.
- Gửi duyệt chỉ khi toàn bộ kiểm tra bắt buộc đạt.
- `PUBLISHED` không được cập nhật; chỉnh sửa bằng cách clone thành version mới.
- Mỗi template code chỉ có một version active mặc định tại một thời điểm.
- Rollback là chuyển active pointer về một version đã publish, không sửa artifact cũ.

## 5. Kiến trúc đích

```text
React Template Studio
        |
Template Management API (VIMES backend)
        |-- PostgreSQL: metadata, workflow, test run, audit
        |-- Object Storage: DOCX, preview PDF, test artifacts
        |-- Contract/Template Validator
        |
Render Queue (Redis/BullMQ ở giai đoạn scale)
        |
Carbone workers + LibreOffice
```

MVP dùng storage adapter:

- Local filesystem cho môi trường phát triển.
- MinIO/S3-compatible cho staging/production.
- Database chỉ lưu object key, checksum, size và content type; không lưu DOCX/PDF dạng bytea.

`TemplateRegistry` được chuyển thành interface. `DatabaseTemplateRegistry` là nguồn chính; registry filesystem hiện tại được giữ làm adapter tương thích và công cụ import 5 mẫu ban đầu.

## 6. Mô hình dữ liệu đề xuất

### `hms_document_template`

- `id`, `code`, `name`, `document_type`, `module_code`
- `description`, `is_active`, `created_at`, `created_by`
- `code` duy nhất, không đổi sau khi tạo

### `hms_document_template_version`

- `id`, `template_id`, `version`, `status`
- `contract_id`, `artifact_key`, `artifact_sha256`, `artifact_size`
- `sample_data`, `change_note`
- `created_by`, `submitted_by`, `reviewed_by`, `published_by`
- các timestamp tương ứng
- unique `(template_id, version)`

### `hms_document_data_contract`

- `id`, `code`, `version`, `name`, `json_schema`, `status`
- Contract đã publish là bất biến.

### `hms_document_template_test_case`

- `id`, `template_version_id`, `name`, `test_type`, `input_data`
- `is_required`, `expected_page_min`, `expected_page_max`

### `hms_document_template_test_run`

- `id`, `template_version_id`, `test_case_id`, `status`
- `validation_errors`, `validation_warnings`
- `docx_key`, `pdf_key`, checksum, page count, duration
- `carbone_version`, `converter_version`, `created_by`, `created_at`

### `hms_document_template_audit`

- actor, action, entity, entity id, before/after JSON, timestamp, IP/request id
- Không ghi dữ liệu bệnh nhân thật vào audit log.

Migration phải được tạo bằng file đánh số tiếp theo trong `backend/migrations`, có `IF NOT EXISTS` và index cho code, status, template/version và created_at.

## 7. API cần xây dựng

Base path: `/api/v1/template-studio`.

### Template và version

- `GET /templates`
- `POST /templates`
- `GET /templates/:id`
- `POST /templates/:id/versions` — clone version hoặc tạo mới
- `GET /versions/:id/download`
- `POST /versions/:id/upload` — multipart DOCX, chỉ Draft
- `POST /versions/:id/submit`
- `POST /versions/:id/approve`
- `POST /versions/:id/reject`
- `POST /versions/:id/publish`
- `POST /versions/:id/retire`
- `POST /templates/:id/rollback/:versionId`

### Contract và field catalog

- `GET /contracts`
- `GET /contracts/:id/fields` — trả cây field, kiểu, bắt buộc, ví dụ và tag
- `GET /contracts/:id/starter-kit` — DOCX/JSON hướng dẫn cho template code
- API quản trị contract nằm sau quyền Administrator.

### Kiểm tra và preview

- `POST /versions/:id/validate`
- `GET/POST/PUT/DELETE /versions/:id/test-cases`
- `POST /versions/:id/test-runs`
- `GET /test-runs/:runId`
- `GET /test-runs/:runId/artifacts/:format`

Test run nên trả `202 Accepted` cùng job id khi chuyển sang queue; UI polling hoặc SSE cập nhật trạng thái.

## 8. Pipeline kiểm tra

### Kiểm tra file trước khi lưu

- Chỉ chấp nhận `.docx`, xác minh MIME và ZIP signature.
- Giới hạn kích thước khởi điểm 20 MB và tổng kích thước giải nén.
- Chặn macro/OLE/external relationship nguy hiểm và path traversal trong ZIP.
- Kiểm tra các phần XML bắt buộc của OpenXML.
- Tính SHA-256, phát hiện upload trùng.

### Kiểm tra template

- Trích xuất tag từ body, header, footer, textbox và table.
- Đối chiếu từng field với JSON Schema của data contract.
- Phát hiện tag sai cú pháp, field không tồn tại và vòng lặp không cân bằng.
- Kiểm tra font, khổ giấy, orientation, margin, ảnh lớn và external link.
- Cảnh báo template không dùng trường nghiệp vụ bắt buộc.

### Kiểm tra render

- Render cả DOCX và PDF qua đúng image Carbone/converter production.
- Xác nhận file đầu ra hợp lệ, không còn tag `{d...}`.
- Ghi page count, dung lượng, duration và checksum.
- Chạy bộ test bắt buộc: normal, empty optional, long text, one row, many rows và page break.
- MVP cho reviewer xem PDF thủ công; visual regression tự động triển khai sau khi baseline ổn định.

## 9. Giao diện Template Studio

Module frontend đề xuất: `modules/document-engine/template-studio/`.

### Màn hình danh sách

- Lọc theo module, loại tài liệu, trạng thái và người phụ trách.
- Hiển thị version active, draft mới nhất, lần test gần nhất và người cập nhật.
- Hành động theo permission: tạo, clone, tải về, gửi duyệt, publish, rollback.

### Màn hình chi tiết/version workspace

- Tab `Thông tin`, `Trường dữ liệu`, `Thiết kế DOCX`, `Dữ liệu kiểm thử`, `Kết quả`, `Lịch sử`.
- Drag/drop upload, checksum và lịch sử file.
- Nút tải starter kit và DOCX hiện tại.

### Field Catalog

- Cây tìm kiếm theo tên nghiệp vụ hoặc đường dẫn.
- Hiển thị tag Carbone, kiểu dữ liệu, bắt buộc, ví dụ và nút Copy.
- Với array, tạo snippet/bảng lặp mẫu để tải xuống; người dùng không tự viết `[i+1]`.

### Test Lab

- JSON form được sinh từ schema; có chế độ JSON nâng cao.
- Chạy một hoặc toàn bộ test case.
- Preview PDF, tải DOCX/PDF, hiển thị lỗi/warning/page count/duration.

### Review/Publish

- Checklist bắt buộc, change note, nhận xét reviewer.
- Xác nhận lại khi publish/rollback và ghi audit.

## 10. Tải, độ ổn định và vận hành

- Preview/test là hàng đợi riêng, ưu tiên thấp hơn render khám chữa bệnh.
- Production render và studio test không dùng chung concurrency pool.
- Idempotency theo `template checksum + data checksum + output format + engine version`.
- Giới hạn số test đồng thời theo user và toàn hệ thống.
- Timeout/retry có giới hạn; không retry lỗi syntax/data contract.
- Object lifecycle tự xóa preview/test artifact sau 7–30 ngày; giữ artifact published theo retention.
- Metrics: queue depth, active jobs, p50/p95/p99, failure by reason, artifact size, publish count.
- Pin Carbone, LibreOffice và font image version; lưu version vào mỗi test run.

## 11. Kế hoạch triển khai

### Giai đoạn 0 — Chốt hợp đồng dữ liệu (3–5 ngày)

- Chuẩn hóa JSON Schema cho 5 loại biểu mẫu.
- Xác định permission và người chịu trách nhiệm duyệt/phát hành.
- Chốt storage adapter và quy tắc retention.

Nghiệm thu: 5 schema có dữ liệu ví dụ, field description và bộ test biên.

### Giai đoạn 1 — Backend MVP (7–10 ngày)

- Migration metadata/workflow/audit.
- Storage abstraction và local storage adapter.
- CRUD template/version, upload/download và import 5 mẫu hiện tại.
- Validator an toàn DOCX, field/tag và render test đồng bộ có giới hạn.
- Unit/integration tests cho quyền, workflow và immutable published version.

Nghiệm thu: tạo Draft -> upload -> validate -> test -> approve -> publish -> render qua API.

### Giai đoạn 2 — Frontend MVP (7–10 ngày)

- Danh sách, workspace, field catalog, upload/download.
- Test data editor, PDF preview, kết quả validation.
- Review/publish/rollback theo permission.

Nghiệm thu: một nhân viên triển khai không sửa source code vẫn tạo được version mới của cả 5 mẫu.

### Giai đoạn 3 — Production hardening (7–10 ngày)

- MinIO/S3 adapter, Redis/BullMQ và worker pool tách biệt.
- Antivirus hook, quota/rate limit, audit/reporting và cleanup job.
- Load, spike, soak và failover test.
- Runbook backup/restore, rollback và xử lý Carbone outage.

Nghiệm thu: test studio không làm tăng p95 của luồng in khám chữa bệnh vượt ngưỡng thống nhất; worker lỗi không mất job; rollback active version dưới một phút.

### Giai đoạn 4 — Nâng cao

- Visual regression theo page image và vùng bỏ qua động.
- Bộ sinh snippet DOCX cho bảng lặp, QR/barcode, chữ ký.
- Comment theo version, notification và dashboard SLA.
- Import/export template package giữa dev, staging và production.

## 12. Thứ tự code khuyến nghị

1. Data contract + schema cho 5 mẫu.
2. Migration và repository.
3. Storage adapter.
4. DOCX validator/tag extractor.
5. Workflow service và API.
6. Import 5 template hiện tại.
7. Frontend list/workspace/field catalog.
8. Test Lab và preview.
9. Queue/object storage production.
10. Load/security/operational tests.

## 13. Điều kiện hoàn thành MVP

- Người dùng tải được DOCX hiện hành về, sửa trong Word và upload thành Draft mới.
- Hệ thống không cho publish nếu file hỏng, tag sai, field ngoài contract hoặc test bắt buộc thất bại.
- Preview DOCX và PDF đúng dữ liệu tiếng Việt, bảng lặp và ngắt trang.
- Published version bất biến, có checksum và đầy đủ audit.
- Phân quyền và phân tách người thiết kế/người duyệt hoạt động.
- Có thể rollback mà không deploy lại backend.
- 5 mẫu hiện tại được import và render không hồi quy.
- Luồng render nghiệp vụ hiện tại tiếp tục hoạt động trong quá trình chuyển registry.

## 14. Các quyết định cần xác nhận trước khi triển khai

- Production dùng MinIO tự quản hay S3-compatible hiện có.
- Có yêu cầu Microsoft Word bắt buộc hay phải hỗ trợ LibreOffice ngang nhau.
- Cơ chế phê duyệt một cấp hay hai cấp (nghiệp vụ và CNTT).
- Thời gian giữ preview/test artifact.
- Bộ font chuẩn và quy định barcode/QR/chữ ký số.
- Template Studio chỉ dùng nội bộ một bệnh viện hay hỗ trợ multi-tenant/nhiều cơ sở ngay từ đầu.
