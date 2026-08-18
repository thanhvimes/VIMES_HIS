# DS-03 PDF placement evidence

Đã tạo `modules/document-engine/components/PdfSignaturePlacement.tsx`:

Backend placeholder API đã đủ list/create/update/retire và chỉ cho chỉnh sửa version DRAFT.

Update placeholder tự đồng bộ `crop_box` và `normalized_rect`; contract test xác nhận route list/create/update/retire và signing audit/complete tồn tại.

Route create/update kiểm tra numeric geometry, page bounds và rotation `0/90/180/270` trước khi gọi repository; placeholder geometry test đã được thêm.

Error contract đã được tài liệu hóa: frontend phải xử lý `422 INVALID_PLACEHOLDER_GEOMETRY` và `409 PLACEHOLDER_VERSION_NOT_DRAFT` theo hướng dẫn OpenAPI.

Repository kiểm tra giao nhau theo page/rectangle và trả `409 PLACEHOLDER_OVERLAP` trước insert.

Kiểm tra overlap cũng áp dụng khi update, loại trừ chính placeholder đang sửa để cho phép thay đổi metadata mà không tự xung đột.

Migration `052` bổ sung PostgreSQL `btree_gist` + exclusion constraint `ex_hms_sig_placeholder_no_overlap`, bảo vệ cả trường hợp hai request tạo/cập nhật đồng thời.

API và database trigger `trg_hms_signature_placeholder_immutable` đều chặn update/delete sau khi template version publish; placeholder configuration trở thành immutable.

- Render PDF nhiều trang bằng `react-pdf`/PDF.js.
- Freestyle pointer drag tạo rectangle và đổi từ screen coordinate sang PDF point.
- Placeholder overlay dùng `pageIndex`, `x1Pt/y1Pt/x2Pt/y2Pt`, page size và trạng thái.
- Callback riêng cho `onFreestyleSelect` và `onPlaceholderClick` để tích hợp signing session API.
- Có giới hạn vùng tối thiểu và placeholder không nhận tọa độ từ client.

Root frontend `npm run typecheck` đã đạt.

## Giới hạn hiện tại

Component đang dùng rotation 0 trong callback freestyle; cần bổ sung test rotation/CropBox và tích hợp màn hình HIS thật trước khi đóng DS-03/DS-04 production gate.
