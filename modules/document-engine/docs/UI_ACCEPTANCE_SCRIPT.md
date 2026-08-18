# UI acceptance script

1. Đăng nhập bằng tài khoản quản trị có quyền `DOCUMENT_TEMPLATE_ADMIN`.
2. Truy cập `/documents/template-studio`.
3. Xác nhận danh sách 5 template framework hiển thị.
4. Mở Field Catalog, sao chép một tag scalar và một tag repeating.
5. Tạo version nháp, nhập sample data hợp lệ và lưu.
6. Download DOCX, upload lại và xác nhận validator không có lỗi nghiêm trọng.
7. Preview DOCX và PDF, mở artifact bằng signed URL.
8. Ghi lại screenshot, version ID, test run ID vào evidence folder.

## Evidence template

| Bước | Kết quả | ID/URL bằng chứng | Người xác nhận |
|---|---|---|---|
| Upload DOCX |  |  |  |
| Validator warning/error |  |  |  |
| Preview DOCX |  |  |  |
| Preview PDF |  |  |  |
| Gửi duyệt |  |  |  |

## Evidence bổ sung cho 5 bước thủ công

| Bước | Bằng chứng bắt buộc |
|---|---|
| Đăng nhập Publisher | username/role (không lưu password), timestamp |
| Phát hành | version ID, audit event `PUBLISHED` |
| Document Engine dùng version mới | template code, active version, preview/test run ID |
| Rollback | target version, audit event `ROLLBACK` |
| Audit log | ảnh/export audit record có actor và timestamp |

Sau khi chạy browser, validate JSON bằng `node backend/scripts/validate-ui-evidence.cjs ui-evidence.json`.

Các bước download/chỉnh sửa/upload/validator/preview dùng `node backend/scripts/validate-template-edit-evidence.cjs edit-evidence.json`.

Workflow release dùng `node backend/scripts/validate-release-evidence.cjs release-evidence.json`.

Hậu phát hành dùng `node backend/scripts/validate-post-release-evidence.cjs post-release-evidence.json`.
