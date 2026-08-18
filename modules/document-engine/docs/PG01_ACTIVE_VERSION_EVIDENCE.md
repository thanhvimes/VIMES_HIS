# PG-01 evidence

Đã triển khai:

- `TemplateRegistry.resolveActive()` đọc `hms_document_template.active_version_id` và chỉ nhận version `PUBLISHED` có `artifact_key`.
- `DocumentService` mặc định dùng `DOCUMENT_TEMPLATE_SOURCE=database`, tải artifact từ local/S3 storage và render trực tiếp.
- Chỉ khi đặt rõ `DOCUMENT_TEMPLATE_SOURCE=filesystem` mới dùng registry filesystem cho tương thích legacy.
- Khi không tìm thấy active artifact, request fail với lỗi 404/5xx; không fallback âm thầm sang version khác.

Chưa nghiệm thu đạt:

- Integration test active version A → B → rollback A đã đạt trong `template-studio-advanced.test.ts`; test chạy cùng process, không restart backend.
- Còn cần test E2E qua `/api/v1/documents/render` với DB/storage staging và kiểm tra header `X-Document-Template`.
- Cần chạy với dữ liệu staging thật, artifact storage đúng cấu hình và reviewer ký evidence.
