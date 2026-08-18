# DS-04 UI placement evidence

Đã tích hợp màn hình thử nghiệm tại route Documents `signing-demo`:

- Chọn file PDF local.
- Chuyển giữa `Ký tự do` và `Vùng định sẵn`.
- Hiển thị placeholder mẫu `SIG_DOCTOR`.
- Xuất rectangle PDF point từ freestyle hoặc placeholder callback.
- Có service frontend tạo signing session và gửi signature request với `Idempotency-Key`.
- UI đã có Prepare và Complete; Complete bắt buộc provider transaction, artifact key và SHA-256 64 ký tự.
- UI có thể tải và hiển thị audit session gồm actor, action, result và hash sau ký.
- UI hiển thị request status và có nút refresh session để đồng bộ trạng thái server sau prepare/complete.
- Placeholder overlay có thể nạp trực tiếp từ API template version, không còn phụ thuộc dữ liệu hard-code khi chạy với backend.
- Frontend service đã có create/update/retire placeholder; demo có thao tác retire để kiểm tra permission và trạng thái DRAFT.
- Demo có form tạo placeholder từ vùng freestyle đã chọn, nhập template ID/version ID/code/role và gọi API create.
- Demo hỗ trợ chọn placeholder, chọn lại vùng và gọi API update trên template DRAFT.
- UI có nút hủy request trước khi `SIGNED`, đồng bộ trạng thái `CANCELLED` và khóa các thao tác tiếp theo.
- UI có nút hủy toàn bộ signing session, dùng khi đóng hồ sơ hoặc dừng quy trình ký.
- Thao tác hủy có hộp xác nhận; UI không gửi request nếu người dùng chưa xác nhận.
- UI có nút kiểm tra Signing Service readiness trước khi bắt đầu ký.
- UI có nút xem metadata chứng thư ký trước khi Prepare; không hiển thị private key/PIN.
- Logic screen→PDF point đã tách thành `pdfSignatureCoordinates.ts`, kiểm tra page geometry và giữ tỷ lệ khi zoom.
- Hiển thị JSON tọa độ để đội triển khai đối chiếu với API signing session.

Root frontend `npm run typecheck` đã đạt.

Đây là màn hình acceptance/demo, chưa phải workflow ký bệnh án production; cần nối API session/provider và kiểm thử browser thực tế.
