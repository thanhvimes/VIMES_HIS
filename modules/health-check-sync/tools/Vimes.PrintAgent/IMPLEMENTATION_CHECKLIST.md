# Kế hoạch triển khai VIMES Workstation Agent

## 1. Mục tiêu

Phát triển `Vimes.PrintAgent` thành `VIMES Workstation Agent`: dịch vụ trung gian an toàn giữa trình duyệt VIMES HIS/EMR và môi trường Windows, hỗ trợ in, ký số USB Token, chứng thư số, file, scanner và thiết bị ngoại vi.

Luồng mục tiêu:

```text
VIMES HIS/EMR Web
        |
        | localhost API/WebSocket
        v
VIMES Workstation Agent
        |
        +-- Printing
        +-- Digital Signing
        +-- File Bridge
        +-- Scanner/Imaging
        +-- Device Bridge
        +-- Diagnostics/Updater
```

## 2. Nguyên tắc bắt buộc

- [ ] Chỉ lắng nghe trên `127.0.0.1`; không bind `0.0.0.0`.
- [ ] Không cung cấp API chạy command/script tùy ý.
- [ ] Mỗi chức năng máy trạm là một capability cụ thể, có quyền và contract riêng.
- [ ] Private key USB Token không được rời khỏi Token/CSP/KSP.
- [ ] Không nhận, lưu hoặc ghi log PIN USB Token.
- [ ] Không lưu hồ sơ bệnh án cục bộ lâu hơn thời gian cần xử lý.
- [ ] Mọi thao tác nhạy cảm phải có audit và transaction ID.
- [ ] Mọi request phải xác thực nguồn gọi, chống replay và giới hạn thời gian.
- [ ] Bộ cài, executable, manifest và bản cập nhật phải có chữ ký số.
- [ ] Luồng in/ký phải idempotent, không thực hiện lặp khi backend retry.
- [ ] Module mới không được phá vỡ luồng in hiện có trước khi nghiệm thu thay thế.

## 3. Trạng thái MVP hiện tại

- [x] Có project ASP.NET Core/.NET 8 cho Windows.
- [x] Có khả năng chạy dưới dạng Windows Service.
- [x] Chỉ mở API tại `http://127.0.0.1:18181`.
- [x] Có `GET /health`.
- [x] Có `GET /printers`.
- [x] Có `POST /print` nhận ZPL.
- [x] Có `GET /jobs/{id}`.
- [x] Có hàng đợi in trong bộ nhớ.
- [x] Có gửi RAW ZPL qua Windows Spooler.
- [x] Có bản nháp bộ cài Inno Setup.
- [x] Project build thành công, không có warning/error.
- [x] Frontend HIS đã chuyển các luồng in barcode KSK, xét nghiệm và tiếp đón sang Workstation Agent.
- [ ] Chưa kiểm thử với máy in thật.
- [ ] Chưa có xác thực và bảo mật localhost đầy đủ.
- [ ] Chưa có Desktop Companion/System Tray.
- [x] Đã có persistent store SQLite cho print job và signing job; payload nhạy cảm được mã hóa.
- [x] Đã có module ký số USB Token qua Windows Certificate Store/Desktop Companion.

## 4. Giai đoạn 1 — Tái cấu trúc nền tảng

### 4.1. Đổi tên và tổ chức solution

- [x] Đổi tên sản phẩm thành `VIMES Workstation Agent`.
- [ ] Đổi namespace từ `Vimes.PrintAgent` sang `Vimes.WorkstationAgent`.
- [x] Tạo solution `.sln`.
- [x] Tách `Vimes.Agent.Contracts` chứa DTO, enum và interface chung.
- [x] Tách `Vimes.Agent.Host` chứa localhost API và Windows Service.
- [x] Tách `Vimes.Agent.Desktop` chứa System Tray và nền tảng tương tác người dùng.
- [x] Tách `Vimes.Agent.Security`.
- [x] Tách `Vimes.Agent.Persistence`.
- [ ] Tách `Vimes.Agent.Updater`.
- [x] Tách Printing capability thành project riêng; các capability khác thực hiện theo giai đoạn.

Cấu trúc mục tiêu:

```text
src/
  Vimes.Agent.Host/
  Vimes.Agent.Desktop/
  Vimes.Agent.Contracts/
  Vimes.Agent.Security/
  Vimes.Agent.Persistence/
  Vimes.Agent.Updater/
  Capabilities/
    Vimes.Agent.Printing/
    Vimes.Agent.Signing/
    Vimes.Agent.Files/
    Vimes.Agent.Scanner/
    Vimes.Agent.Devices/
tests/
installer/
docs/
```

### 4.2. Chuẩn hóa API

- [x] Đặt base path `/api/v1`.
- [x] Chuẩn hóa response thành công và response lỗi cho Agent Core hiện tại.
- [x] Mọi lỗi của endpoint mới có `code`, `message`, `correlationId`.
- [x] Thêm `GET /api/v1/health`.
- [x] Thêm `GET /api/v1/version`.
- [x] Thêm `GET /api/v1/capabilities`.
- [ ] Thêm `GET /api/v1/device` trả machine ID an toàn.
- [ ] Thêm OpenAPI nội bộ cho development/test.
- [ ] Giới hạn kích thước request theo từng endpoint.
- [ ] Thêm timeout và cancellation token.
- [x] Signing job dùng trạng thái chuẩn: `queued`, `awaiting_user`, `processing`, `completed`, `failed`, `cancelled`, `expired`.
- [ ] Thêm WebSocket/SSE để frontend theo dõi trạng thái job.
- [ ] Duy trì compatibility trong cùng major API version.

### 4.3. Capability contract

- [ ] Tạo `IWorkstationCapability`.
- [ ] Capability khai báo tên, version và health status.
- [ ] Capability tự đăng ký endpoint qua contract giới hạn.
- [ ] Không nạp DLL tùy ý từ thư mục ngoài.
- [ ] Chỉ nạp capability có trong signed manifest.
- [ ] Kiểm tra hash module trước khi khởi động.
- [ ] Agent từ chối module không tương thích API version.

## 5. Giai đoạn 2 — Bảo mật nền tảng

### 5.1. Bảo vệ localhost API

- [x] Chỉ bind `127.0.0.1`; chưa bật IPv6.
- [x] CORS dùng allowlist cấu hình; không dùng `*`.
- [x] Kiểm tra header `Origin` cho request ghi từ browser.
- [ ] Từ chối origin rỗng trừ endpoint health công khai tối thiểu.
- [ ] Backend VIMES phát hành workstation token thời hạn ngắn.
- [ ] Thêm challenge-response khi tạo session.
- [ ] Mỗi request nghiệp vụ có `requestId`, `timestamp`, `nonce`, `payloadHash`; challenge authorization đã có chữ ký RSA nhưng request-level signing chưa hoàn tất.
- [x] Challenge/nonce chỉ dùng một lần.
- [x] Từ chối challenge quá thời hạn; request-level timestamp thực hiện tiếp.
- [x] Thêm fixed-window rate limit cho session và print job; tiếp tục tinh chỉnh partition theo session/capability khi frontend tích hợp.
- [x] Thêm idempotency key cho tác vụ in; ký số thực hiện ở giai đoạn tương ứng.
- [x] Session Agent tự hết hạn theo TTL và bị ràng buộc với Origin; liên kết logout HIS thực hiện khi tích hợp frontend/backend.
- [ ] Agent không tin `printer`, `path`, `provider` ngoài policy cho phép.

### 5.2. Quản lý danh tính máy trạm

- [ ] Sinh `agentId` khi cài đặt.
- [ ] Đăng ký agent với backend HIS/EMR.
- [ ] Tạo key pair riêng cho agent bằng Windows CNG/DPAPI.
- [ ] Private key máy trạm không xuất ra plaintext.
- [ ] Backend lưu public key và trạng thái agent.
- [ ] Có cơ chế revoke agent bị mất hoặc thay máy.
- [ ] Có policy theo bệnh viện, khoa, phòng và máy trạm.

### 5.3. Audit và dữ liệu nhạy cảm

- [ ] Mỗi job có correlation ID và actor ID.
- [ ] Audit gồm capability, action, device, result, timestamp và error code.
- [ ] Không log PIN, private key, access token hoặc nội dung bệnh án đầy đủ.
- [ ] Mask CCCD, BHYT và thông tin định danh trong log kỹ thuật.
- [ ] Có cấu hình thời gian lưu log.
- [ ] Mã hóa secret bằng Windows DPAPI.
- [ ] Log có cơ chế rotation và giới hạn dung lượng.
- [ ] Có API xuất diagnostic bundle đã loại dữ liệu bệnh nhân.

### 5.4. Kiểm thử bảo mật

- [ ] Test origin giả mạo.
- [ ] Test CORS wildcard bị từ chối.
- [ ] Test replay request.
- [ ] Test nonce dùng lại.
- [ ] Test timestamp hết hạn.
- [ ] Test payload bị sửa sau khi ký.
- [ ] Test request vượt giới hạn dung lượng.
- [ ] Test path traversal.
- [ ] Test command injection qua tên máy in/ZPL/provider.
- [ ] Test browser độc hại gọi localhost.
- [ ] Test agent bị downgrade version.

## 6. Giai đoạn 3 — Persistence và hàng đợi

- [x] Dùng SQLite cho print job store; cấu hình cục bộ thực hiện tiếp.
- [x] Tạo schema SQLite khởi tạo có kiểm soát; cần bổ sung bảng migration version khi có migration thứ hai.
- [x] Print job queued/processing được khôi phục khi Windows/service restart.
- [x] Signing job queued/awaiting_user/processing được đưa lại về queued và khôi phục khi service restart.
- [ ] Lưu trạng thái; số lần retry và retry policy thực hiện tiếp.
- [ ] Retry theo loại lỗi, có exponential backoff.
- [ ] Không retry lỗi nghiệp vụ vĩnh viễn.
- [x] Đảm bảo một idempotency key chỉ tạo một print job trong store hiện tại.
- [ ] Có dead-letter state cho job lỗi nhiều lần.
- [ ] Tự dọn payload mã hóa sau TTL.
- [ ] Giới hạn số job và dung lượng database.
- [x] Mỗi cập nhật trạng thái job dùng câu lệnh SQLite atomic upsert.
- [ ] Có recovery test khi process bị kill giữa tác vụ.

## 7. Giai đoạn 4 — Desktop Companion

- [x] Tạo ứng dụng System Tray chạy theo phiên Windows user.
- [ ] Hoàn thiện màn hình version/trạng thái service; tray hiện đã có trạng thái Desktop Companion.
- [ ] Hiển thị trạng thái máy in, Token và thiết bị khi các capability tương ứng hoàn thiện.
- [ ] Có nút mở trang Diagnostics.
- [ ] Có thông báo job thành công/thất bại.
- [ ] Có UI xác nhận hành động nhạy cảm; IPC handler đã sẵn sàng nhận operation mới.
- [ ] Có UI chọn chứng thư số.
- [ ] Không tự tạo hộp nhập PIN; PIN do middleware Token quản lý.
- [ ] Có UI chọn file/thư mục bằng dialog Windows.
- [x] Installer tạo startup shortcut để Desktop Companion chạy sau khi user đăng nhập.
- [ ] Hỗ trợ nhiều Windows session độc lập.

### 7.1. Giao tiếp Service–Desktop

- [x] Sử dụng Named Pipe cục bộ.
- [x] Named Pipe có ACL cho SID user hiện tại và LocalSystem; pipe name tách theo Windows session.
- [x] Loại bỏ ACL kế thừa/Everyone; chỉ user hiện tại và LocalSystem được cấp quyền.
- [ ] Xác thực hai chiều Service–Desktop ngoài Windows ACL/identity.
- [x] Có protocol version.
- [x] Có timeout và cancellation.
- [x] Protocol hiện không có trường PIN/private key; tiếp tục đảm bảo nguyên tắc này khi thêm signing.
- [ ] Test nhiều user/RDP session đăng nhập đồng thời; active console discovery đã được triển khai.
- [ ] Test Desktop Agent restart khi job đang chờ xác nhận.

## 8. Giai đoạn 5 — Printing capability

### 8.1. API và provider

- [x] Chuyển code in hiện tại sang `Vimes.Agent.Printing`.
- [x] Thêm `GET /api/v1/printing/printers`.
- [x] Thêm `POST /api/v1/printing/jobs`.
- [x] Thêm `GET /api/v1/printing/jobs/{id}`.
- [ ] Thêm `POST /api/v1/printing/jobs/{id}/cancel`.
- [x] Hỗ trợ RAW ZPL qua Windows Spooler với `DOC_INFO_1`.
- [ ] Hỗ trợ ESC/POS khi có yêu cầu.
- [ ] Hỗ trợ PDF qua Windows Spooler/provider phù hợp.
- [x] Hỗ trợ số bản in giới hạn 1–20.
- [x] Validate tên máy in từ danh sách Windows.
- [x] Validate kích thước ZPL tối đa theo cấu hình; PDF chưa triển khai.
- [ ] Mapping máy in theo loại nghiệp vụ và máy trạm.

### 8.2. Tích hợp frontend HIS

- [ ] Tạo `workstationAgentService.ts`.
- [ ] Thêm `healthCheck()` và `getCapabilities()`.
- [ ] Thêm `getPrinters()`.
- [ ] Thêm `printZpl()`.
- [ ] Chuyển `PrintBarcodeForm` sang Workstation Agent.
- [ ] Chuyển `PrintBarcodeXnForm` sang Workstation Agent.
- [x] Không còn QZ Tray fallback trong runtime; fallback hiện tại là cửa sổ in của trình duyệt.
- [x] Đã loại bỏ feature flag QZ Tray khỏi UI; trường cấu hình cũ chỉ giữ để tương thích dữ liệu.
- [ ] Không đánh dấu `barcode_printed=Y` trước khi job `completed`.
- [ ] Hiển thị error code và hướng dẫn rõ cho người dùng.

### 8.3. Kiểm thử in

- [ ] Test máy in Zebra thật.
- [ ] Test tem KSK 40x30, 50x30 và 60x40 nếu áp dụng.
- [ ] Test barcode xét nghiệm.
- [ ] Test Unicode/tiếng Việt trong ZPL theo khả năng máy in.
- [ ] Test máy in offline/hết giấy/mở nắp.
- [ ] Test sai tên máy in.
- [ ] Test gửi trùng idempotency key không in hai lần.
- [ ] Test service restart giữa job.
- [ ] Test nhiều tab gửi in đồng thời.
- [ ] Test 100/500 tem liên tục.
- [ ] Đối chiếu barcode bằng máy quét thật.

## 9. Giai đoạn 6 — Digital Signing capability

### 9.1. Contract ký số

- [x] Chuẩn hóa thành interface `ISigningProvider`; Windows Certificate Store là implementation đầu tiên.
- [x] Tạo DTO `CertificateInfo`, `SignRequest`, `SignResult`.
- [x] Tạo `WindowsCertificateSigningProvider`.
- [x] Truy cập private key qua Windows `GetRSAPrivateKey/GetECDsaPrivateKey`, tương thích CSP/CNG/KSP do middleware CA đăng ký.
- [x] Chuẩn bị extension contract `IPkcs11SigningProvider`.
- [x] Chuẩn bị extension contract `IRemoteHsmSigningProvider`.
- [x] Automated test sử dụng RSA/ECDSA certificate trong bộ nhớ; mock provider đầy đủ thực hiện khi chuyển sang async signing jobs.

### 9.2. API ký số

- [x] `GET /api/v1/signing/providers` trả capability/algorithm và yêu cầu Desktop session.
- [x] `GET /api/v1/signing/certificates`.
- [x] `POST /api/v1/signing/jobs` tạo persistent async job trước khi gọi Desktop/Token.
- [x] `GET /api/v1/signing/jobs/{id}`.
- [x] `POST /api/v1/signing/jobs/{id}/cancel` cho job còn ở trạng thái queued.
- [x] Chỉ nhận hash với transaction ID; việc xác thực transaction backend hoàn chỉnh khi tích hợp backend HIS.
- [x] Contract không có private key hoặc PIN; chỉ chọn certificate thumbprint.
- [x] Transaction có TTL tối đa 15 phút.
- [x] Chặn ký lặp theo unique `transactionId` trong SQLite; Desktop tiếp tục chặn lặp trong process như lớp bảo vệ thứ hai.
- [x] Kiểm tra key usage, private key và thời hạn certificate.
- [x] Trả leaf certificate và certificate chain cùng chữ ký; leaf luôn ở phần tử đầu tiên.

### 9.3. UX và xác nhận người dùng

- [ ] Hiển thị loại tài liệu/mã bệnh nhân/transaction; bổ sung hash rút gọn ở bước UX tiếp theo.
- [ ] UI chọn chứng thư sẽ hiển thị subject, serial, issuer, validity; API đã trả đủ dữ liệu.
- [x] Yêu cầu người dùng xác nhận trước khi gọi private key/Token.
- [x] Cho phép hủy giao dịch tại hộp thoại xác nhận.
- [ ] Phân biệt người ký bác sĩ, lãnh đạo và cơ sở y tế.
- [ ] Cảnh báo chứng thư sắp hết hạn; API đã trả `NotAfter` và `IsValidNow`.
- [x] Agent không có trường nhập/lưu PIN; PIN do middleware USB Token quản lý.

### 9.4. Tích hợp HIS/EMR

- [x] Tạo browser client cho provider/certificate/create job/poll/cancel; hỗ trợ timeout và `AbortSignal`.
- [x] Chuẩn hóa signing job status JSON dạng camelCase để frontend xử lý ổn định.
- [x] Backend tạo signing transaction từ signature request, trả document hash SHA-256 thật và TTL tối đa 15 phút.
- [ ] Agent chỉ nhận transaction đã được backend ký/xác thực.
- [x] Browser coordinator chuyển đúng transaction/hash backend sang Agent để Token ký.
- [x] Backend xác minh detached signature độc lập cho RSA-SHA256; ECDSA và chain trust/revocation production còn thực hiện tiếp.
- [x] Backend và pyHanko có external-signature hai pha cho PDF: prepare ByteRange/CMS attributes, Agent ký digest, complete CMS và validate PAdES.
- [x] Server-side PDF packaging kiểm tra hash artifact nguồn, detached signature, profile/output PDF và checksum sau lưu.
- [x] Digest ký được pyHanko tạo từ CMS signed attributes sau khi khóa PDF ByteRange; artifact nguồn vẫn được đối chiếu `document_sha256`.
- [ ] Lưu audit signer, certificate serial, agentId và workstation.
- [ ] Hỗ trợ ký XML KSK/VNeID.
- [x] Luồng mã nguồn ký PDF EMR PAdES-B-B qua Workstation Agent hoàn thành và đạt round-trip bằng test RSA certificate; USB Token/CA production và B-T/TSA vẫn cần nghiệm thu thật.
- [x] Adapter dùng `/v1/external/prepare` và `/v1/external/complete` có validation nội bộ, không dùng endpoint mock `/v1/complete` để hoàn tất.
- [x] Production readiness bắt buộc PAdES-B-T, TSA/OCSP/CRL HTTPS, trust roots được phê duyệt và revocation `hard-fail`.
- [ ] Chạy PAdES-B-T với TSA RFC 3161 thật và lưu evidence timestamp hợp lệ.
- [ ] Nghiệm thu trust chain/OCSP/CRL bằng certificate USB Token CA production.
- [ ] Hỗ trợ nhiều chữ ký trên một tài liệu.

### 9.5. Kiểm thử USB Token

- [ ] Test Token Viettel-CA; máy phát triển hiện chưa có certificate USB Token trong CurrentUser Store.
- [ ] Test Token VNPT-CA.
- [ ] Test Token FPT-CA hoặc nhà cung cấp thực tế khác.
- [ ] Test sai PIN với middleware Token thật.
- [ ] Test PIN bị khóa.
- [ ] Test rút Token giữa quá trình ký.
- [ ] Test nhiều chứng thư trong một Token.
- [ ] Test chứng thư hết hạn/chưa hiệu lực/bị thu hồi.
- [ ] Test người dùng chọn sai chứng thư.
- [x] Test ký trùng transaction trả về cùng signing job.
- [ ] Test service/desktop restart giữa giao dịch.
- [ ] Test backend từ chối chữ ký không hợp lệ.

## 10. Giai đoạn 7 — File Bridge

- [ ] Chỉ mở/lưu file thông qua capability cụ thể.
- [ ] Không cho web đọc đường dẫn tùy ý.
- [ ] Desktop Agent hiển thị Windows file picker.
- [ ] Giới hạn extension và MIME theo nghiệp vụ.
- [ ] Giới hạn dung lượng file.
- [ ] Quét filename/path traversal.
- [ ] File tạm có TTL và tự dọn.
- [ ] Có checksum trước/sau truyền file.
- [ ] Audit nhưng không ghi nội dung file.
- [ ] Hỗ trợ lưu XML/PDF từ HIS.
- [ ] Hỗ trợ chọn chứng từ scan/import khi có quyền.

## 11. Giai đoạn 8 — Scanner, camera và device bridge

### 11.1. Scanner/imaging

- [ ] Khảo sát TWAIN/WIA theo thiết bị thực tế.
- [ ] Tạo provider abstraction.
- [ ] Liệt kê scanner/camera khả dụng.
- [ ] Chọn DPI, màu và khổ giấy theo policy.
- [ ] Hỗ trợ scan nhiều trang.
- [ ] Trả file qua transaction có checksum.
- [ ] Không giữ ảnh cục bộ sau TTL.
- [ ] Test mất kết nối và kẹt giấy.

### 11.2. Thiết bị ngoại vi

- [ ] Tạo `IDeviceProvider`.
- [ ] Hỗ trợ COM/Serial qua adapter.
- [ ] Hỗ trợ TCP cục bộ qua adapter.
- [ ] Hỗ trợ USB HID nếu thiết bị yêu cầu.
- [ ] Mỗi hãng/thiết bị có plugin riêng.
- [ ] Không cho frontend gửi raw OS command.
- [ ] Validate protocol và kích thước message.
- [ ] Có timeout, retry và circuit breaker.
- [ ] Có simulator để test không cần thiết bị thật.

## 12. Giai đoạn 9 — Diagnostics và quản trị máy trạm

- [ ] Trang trạng thái service/desktop.
- [ ] Hiển thị agent version và API version.
- [ ] Kiểm tra Windows Spooler.
- [ ] Kiểm tra máy in mặc định/được cấu hình.
- [ ] Kiểm tra Token middleware/provider.
- [ ] Kiểm tra certificate store.
- [ ] Kiểm tra kết nối backend VIMES.
- [ ] Kiểm tra clock lệch so với server.
- [ ] Tạo diagnostic report không chứa PHI.
- [ ] Backend xem trạng thái online/offline của agent.
- [ ] Backend quản lý minimum supported version.
- [ ] Có cảnh báo agent cần cập nhật.

## 13. Giai đoạn 10 — Cập nhật và bộ cài

- [ ] Publish self-contained `win-x64`.
- [ ] Xây dựng installer cho Service và Desktop Agent.
- [x] Installer đăng ký Windows Service tự khởi động.
- [x] Desktop Agent tự khởi động theo user login qua common startup shortcut.
- [ ] Installer kiểm tra quyền administrator.
- [ ] Installer có rollback khi cài lỗi.
- [ ] Hỗ trợ silent install cho IT bệnh viện.
- [ ] Hỗ trợ silent uninstall có kiểm soát.
- [ ] Code-sign `.exe`, `.dll` và installer.
- [ ] Bản cập nhật có signed manifest và SHA-256.
- [ ] Chia channel `Internal`, `Pilot`, `Stable`.
- [ ] Không cập nhật khi có job in/ký đang xử lý.
- [ ] Health check sau update.
- [ ] Tự rollback nếu service không khởi động.
- [ ] Giữ cấu hình khi nâng cấp.
- [ ] Không giữ secret khi uninstall hoàn toàn nếu người quản trị chọn xóa.

## 14. Giai đoạn 11 — Observability và vận hành

- [ ] Structured logging JSON hoặc Windows Event Log.
- [ ] Correlation ID xuyên suốt Browser–Backend–Agent.
- [ ] Metrics: số job, latency, retry, failure theo capability.
- [ ] Không gửi PHI trong telemetry.
- [ ] Có health heartbeat tùy policy bệnh viện.
- [ ] Có dashboard agent version và lỗi phổ biến.
- [ ] Có runbook xử lý máy in, Token và service lỗi.
- [ ] Có mức log Normal/Diagnostic; Diagnostic tự hết hạn.
- [ ] Có cảnh báo dung lượng database/log.

## 15. Chiến lược kiểm thử

### 15.1. Unit test

- [ ] API validation.
- [ ] Hoàn thiện toàn bộ state transition của job; trạng thái in cơ bản đã có test gián tiếp.
- [x] Idempotency print queue có unit test.
- [ ] Retry policy.
- [ ] Payload hashing; payload persistence hiện đã mã hóa DPAPI và có test không lưu plaintext.
- [ ] Certificate filtering.
- [ ] Capability version compatibility.

### 15.2. Integration test

- [ ] Host API với SQLite tạm.
- [x] Service–Desktop Named Pipe có unit/integration round-trip test cùng Windows session.
- [ ] Windows Spooler với mock printer/provider.
- [x] Signing provider core được test bằng RSA/ECDSA certificate tự ký trong bộ nhớ.
- [ ] Backend transaction validation.
- [ ] Restart/recovery.

### 15.3. E2E

- [ ] Browser HIS phát hiện agent.
- [ ] Đăng ký và authorize agent.
- [ ] In barcode KSK.
- [ ] In barcode xét nghiệm.
- [ ] Ký XML bằng Token thật.
- [ ] Ký PDF bằng Token thật.
- [ ] Hiển thị trạng thái realtime.
- [ ] Logout làm session agent hết hiệu lực.

### 15.4. Reliability/security

- [ ] Load test hàng đợi.
- [ ] Soak test 8–24 giờ.
- [ ] Chaos test restart service/desktop/backend.
- [ ] Kiểm thử browser độc hại gọi localhost.
- [ ] Pen-test API localhost và updater.
- [ ] Kiểm tra không rò secret/PHI qua log, crash dump và temp file.

## 16. Nghiệm thu theo giai đoạn

### Milestone A — Agent Core

- [ ] API v1 ổn định.
- [ ] Authentication/origin/replay protection đạt test.
- [x] SQLite print/signing job store và recovery đạt automated test.
- [ ] Desktop Companion giao tiếp an toàn với Service.
- [ ] Bộ cài/upgrade/uninstall chạy được.

### Milestone B — Printing

- [ ] Frontend in qua Workstation Agent.
- [ ] Tem KSK và XN đạt với máy in thật.
- [ ] Không in trùng khi retry/double click.
- [ ] Chỉ đánh dấu đã in sau job thành công.
- [x] QZ Tray đã được loại bỏ khỏi runtime và dependency frontend.

### Milestone C — USB Token Signing

- [ ] Liệt kê đúng certificate.
- [ ] Ký hash đúng bằng ít nhất hai loại Token thực tế.
- [ ] Backend verify thành công.
- [ ] Không lưu PIN/private key.
- [ ] Có user confirmation và audit đầy đủ.
- [ ] Ký XML KSK/VNeID và PDF EMR đạt nghiệm thu.

### Milestone D — Device Platform

- [ ] Capability SDK/contract ổn định.
- [ ] Ít nhất một scanner/device provider hoạt động thực tế.
- [ ] Diagnostics và updater đạt pilot.
- [ ] Có tài liệu tích hợp module mới.

## 17. Definition of Done chung

Một capability chỉ được coi là hoàn thành khi:

- [ ] Có contract/API version rõ ràng.
- [ ] Có authorization và policy tương ứng.
- [ ] Có validation, timeout và cancellation.
- [ ] Có idempotency nếu gây side effect.
- [ ] Có audit không làm lộ PHI/secret.
- [ ] Có unit test và integration test.
- [ ] Có E2E với thiết bị/provider thực tế nếu applicable.
- [ ] Có health check và diagnostic error code.
- [ ] Có tài liệu cài đặt, vận hành và xử lý lỗi.
- [ ] Có rollback/fallback an toàn.
- [ ] Đã qua review bảo mật trước production.

## 18. Thứ tự thực hiện đề xuất

1. [ ] Tái cấu trúc solution và API v1.
2. [ ] Bảo mật localhost, session, nonce và idempotency.
3. [ ] SQLite job store và recovery.
4. [ ] Desktop Companion + Named Pipe.
5. [x] Chuyển Printing capability và frontend khỏi QZ Tray.
6. [ ] Hoàn thiện installer, signing và updater.
7. [ ] Triển khai USB Token Signing provider.
8. [ ] Tích hợp ký XML/PDF với backend HIS/EMR.
9. [ ] Xây dựng File/Scanner/Device capability theo nhu cầu thực tế.
10. [ ] Pilot tại một số máy trạm trước khi triển khai diện rộng.

## 19. Ngoài phạm vi phiên bản đầu

- [ ] Không hỗ trợ điều khiển máy trạm từ xa tùy ý.
- [ ] Không cung cấp shell/PowerShell execution API.
- [ ] Không mở API agent ra LAN/Internet.
- [ ] Không lưu private key hoặc PIN USB Token.
- [ ] Không tự động ký tài liệu mà không có transaction và policy hợp lệ.
- [ ] Không nạp plugin của bên thứ ba chưa được VIMES ký và kiểm định.
