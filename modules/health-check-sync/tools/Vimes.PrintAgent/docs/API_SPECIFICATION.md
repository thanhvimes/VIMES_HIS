# Tài Liệu Kỹ Thuật API - VIMES Workstation Agent (v1.2.0)

> **Vị trí tài liệu chính thức:** [API_VIMES_WORKSTATION_AGENT.md](file:///d:/AI/VIMES_HIS/modules/health-check-sync/docs/API_VIMES_WORKSTATION_AGENT.md)  
> **Phân hệ:** VIMES HIS / Module Khám Sức Khỏe & EMR  
> **Dịch vụ:** VIMES Workstation Agent (`Vimes.WorkstationAgent`)  
> **Phiên bản API:** `v1`  
> **Cổng dịch vụ (Localhost):**  
> - HTTP: `http://127.0.0.1:18181`  
> - HTTPS: `https://127.0.0.1:18182` (Tự sinh chứng chỉ SSL cục bộ)  

---

## 1. Tổng quan Kiến trúc & Năng lực

`VIMES Workstation Agent` là dịch vụ trung gian bảo mật chạy trên máy trạm Windows của nhân viên y tế / kỹ thuật viên, cho phép ứng dụng Web (HIS/LIS/PACS/EMR/KSK) giao tiếp an toàn với các phần cứng cục bộ:
1. **Ký số USB Token (Chữ ký số cá nhân / tổ chức):** Đọc chứng thư từ Windows Certificate Store / USB Token PKCS#11/CSP/CNG/KSP và thực hiện ký số băm (hash) mà **không làm lộ Private Key** hoặc mã PIN ra môi trường web.
2. **In ấn phần cứng (In tem mã vạch ZPL, in phiếu khám, kết quả):** Đẩy lệnh in trực tiếp vào Windows RAW Spooler mà không cần qua hộp thoại in mặc định của trình duyệt.
3. **Mô hình kiến trúc kép (Dual-Process Architecture):**
   - **Agent Host (Windows Service / Console):** Lắng nghe port `18181`/`18182`, quản lý hàng đợi (Queue), bảo vệ dữ liệu SQLite bằng Windows DPAPI, xác thực phiên bằng RSA Challenge-Response.
   - **Desktop Companion (System Tray App theo Session Windows):** Chạy trong phiên người dùng tương tác (`console session`), kết nối với Agent Host qua Windows Named Pipe an toàn (`\\.\pipe\Vimes.Agent.Desktop.<sessionId>`), tương tác trực tiếp với Driver USB Token, hiển thị hộp thoại xác nhận ký / nhập mã PIN.

---

## 2. Danh Sách Endpoint Đầy Đủ

| Phương thức | Đường dẫn Endpoint | Xác thực | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/health` | Không | Kiểm tra trạng thái hoạt động của Agent Service |
| `GET` | `/api/v1/version` | Không | Xem phiên bản, version API và cổng HTTPS |
| `GET` | `/api/v1/capabilities` | Không | Liệt kê các tính năng khả dụng (`printing`, `signing`, `desktop-companion`) |
| `POST` | `/api/v1/session/challenge` | Origin | Tạo challenge phục vụ bắt tay xác thực phiên |
| `POST` | `/api/v1/session/authorize` | Origin | Nhận chữ ký của Backend HIS để cấp `Bearer AccessToken` |
| `GET` | `/api/v1/desktop/status` | Bearer Token | Kiểm tra kết nối tới ứng dụng khay hệ thống Desktop Companion |
| `GET` | `/api/v1/printing/printers` | Bearer Token | Lấy danh sách máy in cài đặt trên Windows máy trạm |
| `POST` | `/api/v1/printing/jobs` | Bearer Token | Đẩy lệnh in RAW (ZPL / ESC-POS / chuỗi mã vạch) vào hàng đợi |
| `GET` | `/api/v1/printing/jobs/{id}` | Bearer Token | Kiểm tra tiến trình và kết quả in theo `jobId` |
| `GET` | `/api/v1/signing/providers` | Không | Lấy thông tin nhà cung cấp ký (Windows Cert Store / RSA / ECDSA) |
| `GET` | `/api/v1/signing/certificates`| Bearer Token | Quét và trả về danh sách chứng thư số có trên USB Token / SmartCard |
| `POST` | `/api/v1/signing/jobs` | Bearer Token | Đẩy yêu cầu ký SHA-256 Hash vào hàng đợi |
| `GET` | `/api/v1/signing/jobs/{id}` | Bearer Token | Polling kết quả ký số và nhận `signatureBase64` |
| `POST` | `/api/v1/signing/jobs/{id}/cancel` | Bearer Token | Hủy yêu cầu ký số đang trong hàng đợi |

---

## 3. Chi Tiết Dữ Liệu Input / Output

### 3.1. Bắt tay tạo phiên (Handshake)
1. `POST /api/v1/session/challenge` -> Trả về `signingPayload`.
2. Backend HIS ký `signingPayload` bằng RSA SHA-256.
3. `POST /api/v1/session/authorize`:
```json
{
  "challengeId": "a1b2c3d4e5f60718",
  "signature": "MEYCIQC...Base64SignatureOfSigningPayload..."
}
```
Trả về: `{ "accessToken": "...", "expiresAt": "..." }`

### 3.2. Lệnh In Tem Mã Vạch (Printing)
`POST /api/v1/printing/jobs`:
```json
{
  "printer": "Xprinter XP-350B",
  "data": "^XA^PW400^LL240^FO20,30^BY2^BCN,60,Y,N,N^FD12345678^FS^FO20,120^A0N,28,28^FDNGUYEN VAN A^FS^XZ",
  "copies": 1,
  "idempotencyKey": "tx_print_01"
}
```
Trả về: `{ "jobId": "prn_7f8a9b0c1d2e", "status": "Queued", "duplicate": false }`

### 3.3. Ký Số Hash (Digital Signing)
`POST /api/v1/signing/jobs`:
```json
{
  "transactionId": "tx_sign_ksk_doc_99182371",
  "certificateThumbprint": "3A89C2F5E0D71B498A1B2C3D4E5F6A7B8C9D0E1F",
  "hashBase64": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  "hashAlgorithm": "SHA256",
  "documentLabel": "Giấy khám sức khỏe lái xe - BN: Nguyễn Văn A (Mã: 24001234)",
  "patientCode": "24001234",
  "expiresAt": "2026-09-29T10:35:00.0000000Z"
}
```
Sau đó Polling `GET /api/v1/signing/jobs/{id}` cho đến khi trạng thái `Completed`:
```json
{
  "jobId": "sig_5e4d3c2b1a0f",
  "transactionId": "tx_sign_ksk_doc_99182371",
  "status": "Completed",
  "result": {
    "transactionId": "tx_sign_ksk_doc_99182371",
    "signatureBase64": "Gz8sK9x...SignatureBase64...",
    "certificateBase64": "MIIFvD...",
    "certificateThumbprint": "3A89C2F5E0D71B498A1B2C3D4E5F6A7B8C9D0E1F",
    "signatureAlgorithm": "RSA",
    "signedAt": "2026-09-29T10:32:14.1500000Z",
    "certificateChainBase64": ["MIIFvD...", "MIIEkj..."]
  }
}
```

---

Xem tài liệu đầy đủ bao gồm sơ đồ tuần tự (Sequence Diagram), mã nguồn TypeScript tích hợp, cấu hình W3C PNA và cURL mẫu tại:  
👉 [Tài liệu API chi tiết tại docs module health-check-sync](file:///d:/AI/VIMES_HIS/modules/health-check-sync/docs/API_VIMES_WORKSTATION_AGENT.md)
