# VIMES Workstation Agent

Dịch vụ trung gian an toàn giữa VIMES HIS/EMR trên trình duyệt và các capability Windows. Giai đoạn hiện tại cung cấp Agent Core và Printing capability.

## Cấu trúc

- `src/Vimes.Agent.Contracts`: DTO và contract dùng chung.
- `src/Vimes.Agent.Printing`: hàng đợi in và Windows RAW Spooler.
- `src/Vimes.Agent.Persistence`: SQLite job store và mã hóa payload bằng Windows DPAPI.
- `src/Vimes.Agent.Security`: challenge–response RSA và session ràng buộc Origin.
- `src/Vimes.Agent.Ipc`: protocol Named Pipe có framing, giới hạn kích thước và ACL.
- `src/Vimes.Agent.Desktop`: System Tray/Desktop Companion theo Windows user session.
- `src/Vimes.Agent.Signing`: Windows Certificate Store, CSP/CNG/KSP và ký hash RSA/ECDSA.
- `src/Vimes.Agent.Host`: Windows Service và localhost API v1.
- `tests/Vimes.Agent.Tests`: unit test.

## Build và test

```powershell
dotnet build .\Vimes.WorkstationAgent.sln
dotnet test .\Vimes.WorkstationAgent.sln
```

## API hiện có

- `GET /api/v1/health`
- `GET /api/v1/version`
- `GET /api/v1/capabilities`
- `POST /api/v1/session/challenge`
- `POST /api/v1/session/authorize`
- `GET /api/v1/printing/printers`
- `POST /api/v1/printing/jobs`
- `GET /api/v1/printing/jobs/{id}`
- `GET /api/v1/desktop/status`
- `GET /api/v1/signing/certificates`
- `GET /api/v1/signing/providers`
- `POST /api/v1/signing/jobs`
- `GET /api/v1/signing/jobs/{id}`
- `POST /api/v1/signing/jobs/{id}/cancel`

Signing jobs are persisted before the Desktop Companion or USB Token is invoked. The browser polls the job URL until a terminal state. A successful result includes the signature, leaf certificate, and certificate chain for independent HIS/EMR verification. The private key and Token PIN never cross the Desktop IPC boundary.
- `POST /api/v1/signing/sign-hash` (preview)

Các request browser bắt buộc dùng `Origin` nằm trong `Agent:AllowedOrigins`. Printing API yêu cầu Bearer session nhận từ challenge–response. Agent phải được enrollment bằng `Security:TrustedBackendPublicKeyPem` trước khi authorize.

## Publish Windows x64

```powershell
.\scripts\publish.ps1
```

Sau đó dùng Inno Setup compile `Installer/Vimes.PrintAgent.iss`.
