# Luồng ký số HIS/EMR qua VIMES Workstation Agent

1. HIS tạo signing session với SHA-256 của đúng phiên bản tài liệu.
2. Người ký tạo signature request; backend khóa `signer_user_id` và idempotency key.
3. Browser gửi certificate công khai đã chọn; backend/pyHanko khóa PDF ByteRange, tạo CMS signed attributes và phát hành digest SHA-256 với TTL tối đa 5 phút.
4. Browser gọi localhost Agent bằng session token, chọn certificate và tạo persistent signing job.
5. Desktop Companion hiển thị xác nhận; middleware USB Token quản lý PIN và private key.
6. Browser polling job. Khi hoàn tất, browser kiểm tra transaction và certificate thumbprint trước khi gửi kết quả về backend.
7. Backend kiểm tra actor, transaction, TTL, certificate, thumbprint và chữ ký trên digest PAdES. Kết quả hợp lệ được lưu vào `hms_document_agent_signature`, request chuyển sang `AUTHORIZED`.
8. Chỉ sau bước xác minh, pipeline PDF/XML mới được phép đóng gói chữ ký và chuyển request sang `SIGNED`.

## Cổng đóng gói PDF

- Backend tự đọc `source_artifact_key` từ storage và đối chiếu SHA-256 đã khóa trong session.
- Browser không được phép tự khai báo artifact đầu ra hoặc checksum để hoàn tất.
- Packager phải trả PDF lớn hơn artifact nguồn và profile hợp lệ `PAdES-B-B/B-T/B-LT/B-LTA`.
- Backend lưu output theo key bất biến, đọc lại và kiểm tra checksum trước khi chuyển `SIGNED`.
- Backend gọi provider qua `/v1/external/prepare` và `/v1/external/complete`. Provider lỗi, timeout, checksum sai hoặc validation không đạt đều fail-closed.

Backend và dịch vụ ký hiện hỗ trợ PAdES external signing và XMLDSig enveloped external signing bằng RSA PKCS#1 v1.5/SHA-256. XMLDSig dùng Exclusive C14N, đặt `ds:Signature` trong `CKS_BENH_VIEN`, khóa byte XML giữa prepare/complete và tự xác minh digest/chữ ký trước khi trả kết quả. PAdES-B-B đã đạt round-trip; PAdES-B-T vẫn yêu cầu TSA thật và nghiệm thu trust chain/OCSP/CRL production.

## Chính sách production

- `SIGNING_PROVIDER=local-agent` và `SIGNING_PROFILE=PAdES-B-T`.
- `SIGNING_TSA_URL`, `SIGNING_OCSP_URL`, `SIGNING_CRL_URL` bắt buộc dùng HTTPS.
- `SIGNING_TRUST_ROOTS_DIR` phải chứa trust root CA được đơn vị phê duyệt; không dùng Windows/system trust ngầm định.
- `SIGNING_REVOCATION_MODE=hard-fail`; không có bằng chứng OCSP/CRL hợp lệ thì không ký thành công.
- MD2, MD5 và SHA-1 bị loại khỏi validation policy.
- Readiness trả HTTP 503 nếu thiếu một trong các điều kiện trên.
