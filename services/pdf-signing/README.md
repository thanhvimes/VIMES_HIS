# VIMES PDF Signing Service

Khung service độc lập cho ký PDF PAdES hai pha.

## Local

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SIGNING_PROVIDER='test'
uvicorn app.main:app --reload --port 8080
```

Health: `GET /`, readiness: `GET /ready`.

Dev compose: `docker compose up --build`. Provider `test` không cần PFX; provider `pkcs12` cần đặt `secrets/signing.pfx` trước khi khởi động. Smoke contract test: `pytest -q test_contract.py`. Không commit file `secrets/signing.pfx`; production phải mount secret từ Vault/KMS/HSM integration.

Sao chép `.env.example` thành `.env` khi chạy local; không commit `.env` hoặc password thật.

Tạo certificate test tạm thời (chỉ staging): `powershell -File scripts/generate-test-pfx.ps1`; sau đó đặt `SIGNING_PROVIDER=pkcs12` và `SIGNING_PFX_PASSWORD=change-me-test-only`. Certificate này không được dùng cho hồ sơ bệnh viện.

Smoke PAdES khi service đang chạy: `powershell -File scripts/smoke-pades.ps1`. Exit code `2` nghĩa là provider chưa cấu hình, không phải production pass.

`POST /v1/prepare` tạo transaction/digest ngắn hạn. `POST /v1/complete` hiện chỉ lưu CMS payload để khóa contract; chưa ghi PDF cuối cùng. Chỉ đánh dấu DS-02 PAdES đạt sau khi provider adapter dùng pyHanko tạo/validate PDF bằng test certificate.

Workstation Agent integration uses `POST /v1/external/prepare` and `POST /v1/external/complete`. The first endpoint prepares the PDF ByteRange and CMS signed attributes; the second embeds the raw RSA signature and validates the resulting PAdES signature. In production, readiness requires PAdES-B-T, HTTPS TSA/OCSP/CRL endpoints, explicit approved trust roots and hard-fail revocation policy.

Production không dùng provider `test`; đặt `NODE_ENV=production` và private key phải nằm trong HSM, USB Token qua Local Agent hoặc Remote CA.

Provider contract nằm tại `app/provider_contract.py`. Adapter mới phải trả certificate metadata và CMS signature, không được expose private key. Readiness trả `503` nếu `NODE_ENV=production` nhưng `SIGNING_PROVIDER=test`.
