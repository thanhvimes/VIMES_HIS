# Kế hoạch triển khai ký số PDF cho VIMES_HIS

## 1. Mục tiêu và phạm vi

Xây dựng chức năng ký số cho tài liệu PDF được sinh từ Document Engine, hỗ trợ đồng thời:

1. **Freestyle:** người dùng kéo chuột tạo vùng chữ nhật rồi ký vào vùng đó.
2. **Pre-defined placeholder:** biểu mẫu có sẵn vùng ký; người dùng click vào vùng được phân quyền để ký.

Kết quả phải là PDF có chữ ký số PKI/CMS theo PAdES, kiểm tra được tính toàn vẹn, chứng thư, timestamp và trạng thái thu hồi. Ảnh chữ ký/khung hiển thị chỉ là `appearance`, không được coi là chữ ký số.

## 2. Nguyên tắc kiến trúc bắt buộc

```text
React HIS + PDF.js + overlay
          │
          ▼
VIMES Backend (permission, workflow, session, audit)
          │
          ▼
PDF Signing Service (pyHanko)
          │
          ├── USB Token qua Local Signing Agent
          ├── HSM qua PKCS#11
          └── Remote CA qua API adapter
          │
          ▼
MinIO/S3 versioned + immutable artifact
```

- Carbone chỉ sinh DOCX/PDF trước khi ký.
- Không render lại hoặc sửa trực tiếp PDF sau khi ký.
- Mỗi chữ ký tiếp theo được thêm bằng incremental update.
- Private key và PIN không được gửi hoặc lưu tại frontend/backend HIS.
- Mọi thao tác ký phải gắn với SHA-256 và version cụ thể của tài liệu.

## 3. Công nghệ đề xuất

### Frontend

- `pdfjs-dist`: hiển thị PDF, viewport, rotation và chuyển tọa độ.
- `react-rnd`: kéo, resize vùng ký freestyle.
- HTML overlay tuyệt đối trên từng trang PDF: placeholder và trạng thái ký.
- Có thể chuyển sang `react-konva` nếu phát sinh annotation/vẽ tay phức tạp.

### Backend HIS

- Node.js/TypeScript hiện có: API, phân quyền, signing session, optimistic lock, audit và MinIO.
- PostgreSQL: metadata vùng ký, yêu cầu ký, version và audit.
- Redis/BullMQ: job ký bất đồng bộ, retry có kiểm soát và idempotency.

### Signing service

- Ưu tiên Python + `pyHanko`: tạo `/Sig`, visible appearance, PAdES, TSA, OCSP/CRL và validation.
- Có interface adapter cho `LocalUsbTokenSigner`, `Pkcs11HsmSigner`, `RemoteCaSigner`, `TestPfxSigner`.
- Có thể thay bằng iText Java/.NET nếu cần SLA thương mại; không để thư viện signing rò rỉ vào domain workflow.

## 4. Chuẩn tọa độ thống nhất

Tọa độ chuẩn lưu bằng PDF point (`1 point = 1/72 inch`), gốc ở góc dưới-trái. Không lưu pixel màn hình làm nguồn dữ liệu chính.

```ts
export interface PdfSignatureRect {
  coordinateVersion: 1;
  pageIndex: number;          // bắt đầu từ 0
  x1Pt: number;
  y1Pt: number;
  x2Pt: number;
  y2Pt: number;
  pageWidthPt: number;
  pageHeightPt: number;
  pageRotation: 0 | 90 | 180 | 270;
  cropBox: [number, number, number, number];
}
```

Lưu thêm normalized rectangle để đối chiếu/migration:

```json
{
  "x": 0.5719,
  "y": 0.0977,
  "width": 0.3524,
  "height": 0.0837
}
```

### Chuyển tọa độ freestyle

Frontend phải dùng transformation của PDF.js:

```ts
const [ax, ay] = viewport.convertToPdfPoint(startX, startY);
const [bx, by] = viewport.convertToPdfPoint(endX, endY);
const rect = {
  x1Pt: Math.min(ax, bx),
  y1Pt: Math.min(ay, by),
  x2Pt: Math.max(ax, bx),
  y2Pt: Math.max(ay, by)
};
```

Backend bắt buộc kiểm tra lại page, CropBox, rotation, kích thước tối thiểu, vùng không vượt trang và version/hash tài liệu.

### Placeholder định sẵn

- Ưu tiên PDF AcroForm field `/FT /Sig` có tên ổn định như `SIG_DOCTOR`.
- Nếu PDF do Carbone không giữ field, Template Studio lưu placeholder theo template version rồi Signing Service chèn `/Sig` khi chuẩn bị PDF.
- Frontend chỉ gửi `placeholderId`; backend tự lấy tọa độ tin cậy, không nhận tọa độ placeholder từ client.
- Template có bảng co giãn phải dành vùng ký cố định hoặc trang ký riêng; không gắn cứng vào trang có thể thay đổi page break.

## 5. Mô hình dữ liệu

Tất cả bảng mới dùng tiền tố `hms_document_`.

### `hms_document_signature_placeholder`

- `id`, `template_id`, `template_version_id`
- `code`, `field_name`, `signer_role`, `signing_order`
- `page_index`, `x1_pt`, `y1_pt`, `x2_pt`, `y2_pt`
- `page_width_pt`, `page_height_pt`, `page_rotation`, `crop_box_json`
- `required`, `appearance_profile_id`, `status`
- `created_by`, `created_at`, `updated_at`
- Unique: `(template_version_id, code)` và `(template_version_id, field_name)`.

### `hms_document_signing_session`

- `id`, `document_id`, `document_version`, `document_sha256`
- `source_artifact_key`, `result_artifact_key`
- `status`: `OPEN`, `PROCESSING`, `PARTIALLY_SIGNED`, `COMPLETED`, `FAILED`, `EXPIRED`, `CANCELLED`
- `expires_at`, `created_by`, `created_at`, `completed_at`, `row_version`

### `hms_document_signature_request`

- `id`, `session_id`, `placeholder_id` nullable
- `placement_type`: `FREESTYLE` hoặc `PLACEHOLDER`
- page và rectangle PDF point
- `signer_user_id`, `signer_role`, `signing_order`
- `reason`, `location`, `appearance_profile_id`
- `certificate_subject`, `certificate_issuer`, `certificate_serial`
- `status`, `request_id` idempotency key, `created_at`, `signed_at`

### `hms_document_signature_audit`

- actor, role, IP, user agent/device, correlation ID
- document/session/request/version
- action, result, failure code, thời gian
- SHA-256 trước/sau ký, certificate serial, TSA time
- metadata JSON đã lọc PHI; audit là append-only.

### `hms_document_signature_appearance`

- tên profile, logo, font, màu, nội dung hiển thị
- phiên bản profile và trạng thái active
- không chứa private key/PIN/PFX password.

## 6. API dự kiến

```text
GET    /api/documents/:id/signature-context
POST   /api/documents/:id/signing-sessions
POST   /api/signing-sessions/:id/requests
GET    /api/signing-sessions/:id
POST   /api/signature-requests/:id/prepare
POST   /api/signature-requests/:id/complete
POST   /api/signing-sessions/:id/cancel
GET    /api/documents/:id/signatures/validate

GET    /api/template-studio/versions/:id/signature-placeholders
POST   /api/template-studio/versions/:id/signature-placeholders
PUT    /api/template-studio/signature-placeholders/:id
DELETE /api/template-studio/signature-placeholders/:id
```

Mọi mutation sử dụng `Idempotency-Key`; thao tác ký dùng `If-Match`/document version. Trả `409 DOCUMENT_VERSION_CHANGED` nếu tài liệu đã được người khác ký trên version mới hơn.

## 7. Luồng nghiệp vụ chi tiết

### 7.1 Chuẩn bị tài liệu

1. HIS yêu cầu Document Engine tạo biểu mẫu.
2. Carbone render PDF hoàn chỉnh.
3. Kiểm tra PDF, số trang, kích thước và font.
4. Tính SHA-256, lưu object nguồn và version.
5. Nạp/chèn placeholder `/Sig` nếu có.
6. Đặt trạng thái `READY_TO_SIGN`; từ đây cấm sửa nội dung.

### 7.2 Freestyle

1. PDF.js hiển thị tài liệu và overlay.
2. Người dùng kéo vùng, resize hoặc hủy.
3. UI đổi viewport rectangle thành PDF rectangle.
4. Gửi page, rectangle, document version/hash và mục đích ký.
5. Backend kiểm tra quyền, giới hạn tọa độ, trạng thái hồ sơ và hash.
6. Backend tạo signature request rồi chuyển sang bước ký.

### 7.3 Placeholder

1. Backend trả placeholder phù hợp role và trạng thái.
2. UI vẽ khung `EMPTY`, `AVAILABLE`, `SIGNED`, `LOCKED`.
3. Người dùng click khung `AVAILABLE`.
4. Client chỉ gửi placeholder ID và document version.
5. Backend kiểm tra role, signing order và lấy rectangle từ DB/PDF.
6. Backend tạo signature request rồi chuyển sang bước ký.

### 7.4 Ký hai pha

1. `prepare`: Signing Service tạo `/Sig`, `/ByteRange`, vùng `/Contents` và appearance; trả digest SHA-256, nonce và transaction ID.
2. Người dùng xác thực USB Token/HSM/Remote CA; signer ký digest và trả CMS/PKCS#7.
3. `complete`: backend kiểm tra transaction, nonce, certificate, request và hash.
4. Signing Service nhúng CMS bằng incremental update.
5. Lấy RFC 3161 timestamp và OCSP/CRL theo profile PAdES.
6. Validate lại chữ ký trước khi công bố artifact.
7. Lưu object mới, SHA-256 mới, audit và tăng document version.
8. Phát event `DOCUMENT_SIGNED`; các signer tiếp theo ký trên artifact mới nhất.

## 8. Phân quyền

Đề xuất permission:

- `DOCUMENT_SIGNATURE_VIEW`
- `DOCUMENT_SIGNATURE_SIGN`
- `DOCUMENT_SIGNATURE_FREESTYLE`
- `DOCUMENT_SIGNATURE_VALIDATE`
- `DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE`
- `DOCUMENT_SIGNATURE_APPEARANCE_MANAGE`
- `DOCUMENT_SIGNATURE_AUDIT_VIEW`

Ngoài RBAC cần kiểm tra quan hệ nghiệp vụ: đúng hồ sơ, đúng bác sĩ/người phụ trách, đúng vai trò placeholder, đúng thứ tự ký và đúng trạng thái bệnh án.

## 9. Bảo mật và pháp lý

- Mục tiêu ban đầu: PAdES B-T; bệnh án lưu dài hạn: PAdES B-LT; đánh giá B-LTA theo chính sách lưu trữ.
- TLS/mTLS giữa backend, Signing Service, HSM/CA, TSA và MinIO.
- Private key chỉ nằm trong USB Token/HSM/CA; tuyệt đối không ghi log PIN, key hoặc CMS chưa lọc.
- Artifact ký lưu object key mới, bật versioning, SSE-KMS và retention/object lock nếu chính sách yêu cầu.
- Chống replay bằng nonce một lần, transaction expiry, idempotency key và hash binding.
- Audit append-only; đồng bộ thời gian NTP và lưu TSA time.
- Validate certificate chain, key usage, expiry, OCSP/CRL và trusted roots bệnh viện/CA.
- Có chính sách quyền ký thay, thu hồi quyền, chứng thư hết hạn và đóng dấu tổ chức.

## 10. Xử lý lỗi và đồng thời

- `409 DOCUMENT_VERSION_CHANGED`: tải version mới và thực hiện lại prepare.
- `409 PLACEHOLDER_ALREADY_SIGNED`: không ghi đè chữ ký.
- `422 INVALID_SIGNATURE_RECT`: vùng nằm ngoài CropBox hoặc quá nhỏ.
- `422 CERTIFICATE_NOT_ALLOWED`: chứng thư/role không hợp lệ.
- `503 TSA_UNAVAILABLE`: retry có giới hạn; không âm thầm hạ PAdES profile.
- Job retry phải idempotent, không tạo hai chữ ký cho cùng request.
- Không retry tự động sau bước yêu cầu người dùng nhập PIN nếu chưa xác định rõ trạng thái giao dịch.

## 11. Kế hoạch triển khai theo giai đoạn

### DS-01 — Domain và database

- [x] Chốt permission matrix tại `DIGITAL_SIGNATURE_PERMISSION_MATRIX.md`; session/request state machine đã được mã hóa trong repository/service.
- [x] Tạo migrations các bảng `hms_document_signature_*`, index và constraint (`052_hms_document_digital_signature.sql`).
- [x] Repository/service có transaction, optimistic locking, idempotency và state transitions (`backend/src/document-signature/`).
- [x] Contract API và error code v1 được mô tả tại `DIGITAL_SIGNATURE_OPENAPI.md`; hoàn thiện `complete` PAdES contract sau khi tích hợp signing provider.

### DS-02 — Signing Service nền tảng

Checklist chuyển production: `SIGNING_PROVIDER_PRODUCTION_CHECKLIST.md`.

- [x] Tạo service Python/pyHanko và Docker image pin version (`services/pdf-signing`).
- [ ] Endpoint health/readiness không tiết lộ bí mật.
- [x] Tạo field `/Sig`, appearance và ký PAdES B-T bằng test certificate; evidence/validator tại `staging-evidence/PG-11/2026-08-12/`.
- [x] Readiness fail-closed cho provider chưa triển khai, thiếu PFX và provider test trong production; contract tests 6/6.
- [x] Readiness kiểm tra hạn chứng thư trước khi cho phép ký; contract tests 8/8.
- [ ] Validate PDF sau ký và xuất structured validation result.
- [x] Adapter interface cho PFX test, PKCS#11, Local Agent và Remote CA (`provider_contract.py`); provider thật vẫn cần nghiệm thu.

### DS-03 — Placeholder Designer

- [x] Backend placeholder CRUD có list/create/retire, chỉ cho sửa version DRAFT; route tại `/api/v1/signatures/template-versions/:versionId/placeholders`.
- [x] Component `PdfSignaturePlacement` hiển thị PDF bằng `react-pdf`/PDF.js.
- [x] Component hỗ trợ kéo tạo vùng freestyle và click placeholder callback.
- [x] Component trả PDF point, normalized rectangle được backend lưu, page geometry và rotation mặc định.
- [x] API placeholder có error contract geometry/version rõ ràng trong `DIGITAL_SIGNATURE_OPENAPI.md`.
- [x] Kiểm tra overlap, biên trang, kích thước tối thiểu và field name trùng; có application validation và PostgreSQL exclusion constraint.
- [x] Publish template khóa immutable placeholder configuration bằng API draft-only và database trigger.

### DS-04 — Giao diện ký

- [ ] Viewer nhiều trang, zoom/rotation vẫn giữ vị trí chính xác.
- [x] Freestyle drag/resize và xác nhận vùng ký qua signing session API.
- [x] Placeholder click-to-sign và trạng thái trực quan.
- [ ] Dialog xác nhận người ký, lý do, chứng thư và phiên bản tài liệu.
- [x] Hiển thị tiến trình prepare → provider transaction/artifact → complete; validation PAdES độc lập còn ở DS-07.

### DS-05 — Provider thật

- [ ] PoC Local Signing Agent + USB Token tại máy trạm bệnh viện.
- [ ] PoC HSM/PKCS#11 hoặc Remote CA cho dấu tổ chức.
- [ ] Không để private key/PIN ra khỏi thiết bị ký.
- [ ] Timeout, cancellation, retry và reconciliation transaction đầy đủ.
- [ ] Chọn provider production và ký SLA/vận hành.

### DS-06 — Tích hợp workflow HIS/EMR

- [ ] Kiểm tra signer-role theo hồ sơ và khoa/phòng.
- [ ] Hỗ trợ thứ tự ký nhiều người bằng incremental update.
- [ ] Khóa nội dung sau `READY_TO_SIGN` và version conflict bằng `If-Match`.
- [ ] Event/audit liên kết document, encounter, patient và actor ID mà không lộ PHI trong log.
- [ ] Download/print chỉ lấy artifact signed version hợp lệ theo trạng thái nghiệp vụ.

### DS-07 — Kiểm thử

- [ ] Unit test chuyển tọa độ ở zoom 50/100/200%, rotation 0/90/180/270 và CropBox khác MediaBox.
- [ ] E2E freestyle và placeholder trên Chrome/Edge, màn hình thường và HiDPI.
- [ ] Test PDF 1/10/100 trang, bảng kéo dài và trang landscape.
- [ ] Test ký tuần tự 2–5 người, xung đột đồng thời và retry idempotent.
- [ ] Tamper test: sửa một byte sau ký phải validation fail.
- [ ] Test chứng thư hết hạn/thu hồi/sai chain, TSA/OCSP mất kết nối.
- [x] Validator độc lập xác nhận PAdES staging và phát hiện tamper; Adobe/production trust-chain vẫn cần nghiệm thu khi tích hợp CA thật.
- [x] Đóng gói validator tự động `services/pdf-signing/scripts/validate-pades.py` và kiểm tra trong CI.
- [ ] Load/spike/soak có P50/P95/P99, error rate, queue depth và HSM/TSA latency.

### DS-08 — Vận hành và go-live

- [ ] Dashboard signing throughput, latency, failure, queue, TSA/OCSP/HSM health.
- [ ] Alert certificate sắp hết hạn, TSA/HSM lỗi và backlog tăng.
- [ ] Backup/restore metadata và signed artifact có checksum validation.
- [ ] Runbook sự cố, thu hồi chứng thư, rotate key và reconciliation job.
- [ ] Security, Clinical, Legal, Infrastructure và Product Owner ký nghiệm thu.

## 12. Tiêu chí nghiệm thu tối thiểu

- Hai chế độ ký hoạt động đúng trên cùng một pipeline backend.
- Sai số vị trí hiển thị/kết quả PDF không quá 2 PDF points ở các mức zoom/rotation đã kiểm thử.
- Mọi PDF đầu ra validate PAdES và phát hiện được chỉnh sửa sau ký.
- Không có private key/PIN trong browser, backend, database hoặc log.
- Không mất hoặc trùng chữ ký khi retry, restart worker hay ký đồng thời.
- Audit truy vết được ai ký, tài liệu/version/hash nào, thời điểm, chứng thư và kết quả validation.
- Tài liệu nhiều chữ ký vẫn giữ tất cả chữ ký trước hợp lệ.
- Hiệu năng đạt SLA được bệnh viện phê duyệt trên provider production thực tế.

## 13. Thứ tự thực hiện khuyến nghị

1. DS-01 Domain/database.
2. DS-02 Signing Service với test certificate.
3. DS-03 Placeholder Designer.
4. DS-04 UI freestyle và click-to-sign.
5. DS-06 Tích hợp workflow và ký nhiều người.
6. DS-05 Provider USB Token/HSM/Remote CA thật.
7. DS-07 kiểm thử đầy đủ.
8. DS-08 vận hành và go-live.

Không đánh dấu hoàn thành hạng mục tích hợp provider, PAdES hoặc pháp lý chỉ dựa trên mock/test certificate; phải có evidence từ môi trường staging gần production.
