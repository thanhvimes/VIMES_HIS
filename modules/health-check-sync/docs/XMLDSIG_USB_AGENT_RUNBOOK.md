# Runbook ký XML KSK bằng VIMES Workstation Agent

## Luồng vận hành

1. Browser gọi Agent `POST /api/v1/session/challenge`.
2. Browser gửi `signingPayload` tới backend `POST /health-check-sync/agent/session/sign-challenge`.
3. Browser gọi Agent `POST /api/v1/session/authorize` và nhận session token ngắn hạn.
4. Browser lấy chứng thư RSA từ Agent.
5. Backend prepare XML, tạo transaction và trả hash SHA-256 của `SignedInfo`.
6. Agent ký hash bằng USB Token.
7. Backend complete, xác minh chữ ký và lưu XML nguyên byte vào `health_check_masters.signature`.

## Cấu hình bắt buộc

- Backend phải có `WORKSTATION_AGENT_BACKEND_PRIVATE_KEY_PEM`.
- Agent phải cấu hình public key tương ứng tại `Security:TrustedBackendPublicKeyPem`.
- Agent `Agent:AllowedOrigins` phải chứa đúng origin của HIS.
- USB Token phải có chứng thư RSA còn hạn và được Windows Certificate Store nhận diện.

## Kiểm tra nghiệm thu

- Không có USB Token: Agent trả lỗi không có chứng thư hợp lệ.
- Rút Token sau prepare: job ký thất bại, hồ sơ vẫn Unsigned.
- Sửa XML trong lúc chờ PIN: backend từ chối với `XML_CHANGED_AFTER_PREPARE`.
- Gửi lại complete: trả đúng kết quả đã lưu, không tạo chữ ký mới.
- Sai transaction hoặc sai user: backend từ chối với `XMLDSIG_TRANSACTION_MISMATCH`.
- XML đã ký gửi VNeID phải giữ nguyên Base64 từ `signed_file.data_base64`, không serialize lại.

## Chưa coi là nghiệm thu production

Chưa thể xác nhận ký thật nếu chưa có private key enrollment của backend, Agent đã cài trên máy Windows và USB Token thật. Bộ test hiện tại xác nhận contract, cryptography và transaction bằng chứng thư test.
