# Template Release Runbook

## Retention published versions

Định kỳ chạy `npx ts-node backend/scripts/audit-published-template-retention.ts`.
Biến `TEMPLATE_PUBLISHED_RETENTION_DAYS` mặc định 365 ngày. Script chỉ audit, không tự xóa;
mọi quyết định retire/xóa phải được reviewer phê duyệt và giữ version đang được tham chiếu.

Sinh snippet bảng lặp bằng `node backend/scripts/generate-docx-repeat-snippet.cjs items "Danh sách"`.

Sinh cấu hình QR/barcode bằng `node backend/scripts/generate-code-wizard.cjs patientCode qr`
hoặc thay `qr` bằng `barcode`.

Kiểm tra font DOCX bằng `node backend/scripts/audit-template-fonts.cjs template.docx` trước upload.

Đóng gói template bằng `node backend/scripts/template-package.cjs export <dir> <package.zip>`;
kiểm tra trước import bằng `node backend/scripts/template-package.cjs verify <package.zip>`.

Ký manifest bằng `TEMPLATE_PACKAGE_SIGNING_SECRET=... node backend/scripts/sign-template-manifest.cjs sign manifest.json`;
verify trước import với mode `verify`. Production có thể thay HMAC bằng HSM/USB Token.

Trước khi lưu artifact đã ký, chạy `node backend/scripts/verify-signed-artifact.cjs artifact.pdf artifact.sig`;
chỉ lưu khi `valid=true`, checksum được ghi vào audit log và object storage bật versioning/retention.

HSM/USB Token triển khai theo contract tại `SIGNING_PROVIDER.md`; dev không mô phỏng private key phần cứng.

## Quy trình bắt buộc

1. Tạo version nháp, ghi change note.
2. Upload DOCX và kiểm tra validation.
3. Chọn data contract đúng mã template.
4. Chạy toàn bộ test case trên Test Lab.
5. Chỉ gửi duyệt khi tất cả test bắt buộc `PASSED`.
6. Reviewer kiểm tra nội dung, tag, layout và checksum.
7. Reviewer approve; người tạo không được tự duyệt.
8. Publisher xác nhận và publish.
9. Kiểm tra active version và health endpoint.

## Khi có lỗi

- Không sửa version đã publish.
- Tạo version mới từ version gần nhất.
- Sửa DOCX/data contract/test data.
- Chạy lại toàn bộ regression test.
- Job render thất bại sau retry phải xử lý qua DLQ.

## Kiểm tra sau publish

```http
GET /api/template-studio/health
GET /api/template-studio/preview/metrics
```

Lưu lại version, checksum SHA-256, thời điểm publish và người publish trong biên bản release.
