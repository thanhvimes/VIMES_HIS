# PAdES runtime acceptance runbook

## Điều kiện

- Docker Desktop/Engine đang chạy (`docker info` không lỗi).
- Có `pdfsig` hoặc Adobe Acrobat để validate.
- Không dùng dữ liệu bệnh nhân thật.

## Chuẩn bị Windows (khi máy chưa có dependency)

```powershell
# Docker Desktop: cài từ bộ cài nội bộ được IT phê duyệt, sau đó mở Docker Desktop.
winget install --id Docker.DockerDesktop --exact

# OpenSSL để tạo PFX test; có thể thay bằng certificate staging được phê duyệt.
winget install --id ShiningLight.OpenSSL.Light --exact

# Poppler/pdfsig để validate chữ ký; dùng package mirror nội bộ nếu bệnh viện chặn Internet.
winget search poppler
```

Sau cài đặt, mở PowerShell mới và kiểm tra `docker info`, `openssl version`, `pdfsig -h`.

## Staging test

```powershell
cd D:\AI\VIMES_HIS\services\pdf-signing
powershell -File scripts\generate-test-pfx.ps1
$env:NODE_ENV='development'
$env:SIGNING_PROVIDER='pkcs12'
$env:SIGNING_PFX_PASSWORD='change-me-test-only'
docker compose up -d --build
powershell -File scripts\smoke-pades.ps1
```

## Pass criteria

1. `/ready` trả `ready=true` và provider đúng.
2. `smoke-signed.pdf` mở được bằng PDF viewer.
3. `pdfsig smoke-signed.pdf` báo chữ ký hợp lệ, đúng subject/serial/profile.
4. `pdfsig smoke-tampered.pdf` báo chữ ký không hợp lệ.
5. SHA-256 output được lưu vào evidence, không lưu PFX/password.
6. Container log không chứa private key, PIN, PFX hoặc CMS raw.

## Production guard

```powershell
$env:NODE_ENV='production'
$env:SIGNING_PROVIDER='test'
Invoke-WebRequest http://127.0.0.1:8080/ready
```

Request trên phải thất bại HTTP 503. Nếu trả 200, dừng go-live và xử lý cấu hình provider.

## Evidence

Lưu vào `staging-evidence/PG-11/<date>/`:

- `ready.json`
- output của `pdfsig` cho signed/tampered
- SHA-256 output
- image/container version
- người thực hiện và reviewer

Không lưu private key, password, token PIN hoặc PHI thật.
