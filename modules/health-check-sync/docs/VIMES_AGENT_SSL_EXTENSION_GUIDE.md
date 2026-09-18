# Hướng dẫn Ký số USB Token qua VIMES Workstation Agent, Local SSL & Web Extension

## 1. Giới thiệu tổng quan
Tài liệu này hướng dẫn chi tiết về cơ chế kết nối giữa ứng dụng Web VIMES HIS (phân hệ Liên thông KSK VNeID) và thiết bị USB Token ký số (Ban Cơ yếu Chính phủ, Viettel-CA, VNPT-CA, Bkav...) được cắm trực tiếp trên máy tính của Bác sĩ / Cán bộ y tế.

Hệ thống được thiết kế theo **Kiến trúc bảo vệ 3 lớp (Triple-Layer Security Architecture)** nhằm đảm bảo bác sĩ ký số thuận tiện nhất, không gặp rào cản bảo mật của trình duyệt hiện đại (Private Network Access, Mixed Content, CORS).

---

## 2. Kiến trúc 3 lớp kết nối

```
┌─────────────────────────────────────────────────────────────┐
│                    TRÌNH DUYỆT BÁC SĨ                       │
│    (Microsoft Edge / Google Chrome / Cốc Cốc / Brave)       │
│                                                             │
│   Trang Web VIMES HIS (http://... hoặc https://...)         │
│                                                             │
│   [Lớp 3] VIMES Web Extension (Manifest V3)                 │
│      └── Bypass 100% CORS, PNA, Mixed Content               │
│                                                             │
│   [Lớp 1] Enterprise Policies (Tự động nạp qua Installer)   │
│      ├── InsecureOriginsTreatedAsSecure                     │
│      └── LocalNetworkAccessAllowedForUrls                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
             HTTP / HTTPS  │  (18181 / 18182)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  MÁY TRẠM (WORKSTATION)                     │
│                                                             │
│   VIMES Workstation Agent Host (Windows Service LocalSystem)│
│      ├── [Lớp 2] Local SSL Certificate (127.0.0.1:18182)    │
│      └── HTTP Loopback (127.0.0.1:18181)                    │
│                                                             │
│   VIMES Desktop Companion (Systray Tray Icon)               │
│      └── Giao tiếp Named Pipe nội bộ an toàn                 │
│                                                             │
│   Ban Cơ Yếu / CSP / CryptoAPI                              │
│      └── Hiển thị hộp thoại nhập PIN và ký số XML           │
└─────────────────────────────────────────────────────────────┘
```

### Lớp 1: Tự động hóa qua Bộ cài đặt (Zero-Config Installer)
- Khi chạy file `Vimes-Workstation-Agent-Setup.exe` (v1.2.0 trở lên) với quyền Administrator, bộ cài đặt Inno Setup sẽ tự động thêm các khóa Enterprise Policy vào Windows Registry:
  - `HKLM\SOFTWARE\Policies\Microsoft\Edge\InsecureOriginsTreatedAsSecure`
  - `HKLM\SOFTWARE\Policies\Microsoft\Edge\LocalNetworkAccessAllowedForUrls`
  - `HKLM\SOFTWARE\Policies\Microsoft\Edge\InsecurePrivateNetworkRequestsAllowedForUrls`
  - Tương tự cho Google Chrome (`HKLM\SOFTWARE\Policies\Google\Chrome\...`).
- **Lợi ích:** Bác sĩ mở trình duyệt lên là ký được ngay, **không cần mở `edge://flags`** và không cần thao tác cấu hình thủ công.

### Lớp 2: Local SSL Certificate (Sẵn sàng HTTPS)
- `Vimes.Agent.Host` tự động sinh một chứng chỉ X.509 với Subject Alternative Name (SAN) cho `localhost`, `127.0.0.1`, và đăng ký vào Windows Certificate Store (`LocalMachine\Root` và `LocalMachine\My`).
- Dịch vụ lắng nghe đồng thời 2 cổng:
  - `http://127.0.0.1:18181` (Dành cho trang web HTTP).
  - `https://127.0.0.1:18182` (Dành cho trang web HTTPS, triệt tiêu lỗi Mixed Content).

### Lớp 3: VIMES Web Extension (Cầu nối chuẩn công nghiệp)
- Tương tự mô hình ký số của **Tổng cục Thuế (eTax)** và **BHXH Việt Nam**:
  - Tiện ích mở rộng đóng gói tại `{app}\Extension` (hoặc thư mục `modules/health-check-sync/tools/vimes-extension`).
  - Sử dụng Manifest V3, có quyền `host_permissions: ["http://127.0.0.1:18181/*", "https://127.0.0.1:18182/*"]`.
  - Frontend (`healthCheckAgentXmlSigner.ts`) tự động bắt tín hiệu `__VIMES_AGENT_EXTENSION__` và chuyển tiếp luồng ký qua Extension Bridge.

---

## 3. Hướng dẫn cài đặt và sử dụng

### Cho Bác sĩ / Cán bộ y tế (Người dùng cuối):
1. Tải và chạy file cài đặt:
   `D:\AI\VIMES_HIS\modules\health-check-sync\tools\Vimes.PrintAgent\Installer\Vimes-Workstation-Agent-Setup.exe`
2. Bấm **Next** cho đến khi hoàn tất cài đặt.
3. Cắm USB Token Ban Cơ yếu (hoặc USB Token bất kỳ) vào máy tính.
4. Mở trình duyệt và truy cập VIMES HIS (`http://113.160.202.198:8088/#/health-check`).
5. Chọn hồ sơ và bấm **"Khóa & Ký Số"**. Hộp thoại nhập mã PIN USB Token sẽ bật lên để ký.

### Cài đặt VIMES Web Extension (Tùy chọn bổ sung):
Nếu máy tính bị phần mềm bảo mật bên thứ 3 chặn Registry Policy:
1. Mở Microsoft Edge hoặc Google Chrome, truy cập: `edge://extensions` (hoặc `chrome://extensions`).
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc dưới bên trái hoặc góc trên bên phải.
3. Bấm nút **Tải tiện ích giải nén (Load unpacked)**.
4. Chọn thư mục tiện ích:
   `C:\Program Files (x86)\VIMES Workstation Agent\Extension`
   (hoặc `D:\AI\VIMES_HIS\modules\health-check-sync\tools\vimes-extension`).
5. Tiện ích `VIMES HIS - Workstation Signing Bridge` sẽ xuất hiện và hoạt động vĩnh viễn.
