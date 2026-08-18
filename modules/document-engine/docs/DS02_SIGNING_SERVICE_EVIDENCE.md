# DS-02 Signing Service evidence

Đã tạo service độc lập tại `services/pdf-signing`:

- FastAPI health `/` và readiness `/ready`.
- Contract `/v1/prepare`, `/v1/complete` và `/v1/sign-pdf`.
- Adapter PKCS#12/pyHanko, Docker non-root và compose healthcheck.
- Smoke contract test `test_contract.py` cho health, hash validation và chặn provider test.
- `docker compose config` đã kiểm tra hợp lệ; secret PFX được gitignore và có script tạo test-only certificate.
- Provider contract (`provider_contract.py`) và production guard ngăn `SIGNING_PROVIDER=test` được readiness khi `NODE_ENV=production`.
- HIS Backend client `backend/src/document-signature/signing-client.ts` đã gọi readiness/prepare/sign-pdf với timeout và error mapping; test client đạt 2/2, backend typecheck đạt.
- HIS signing domain đã có endpoint complete và transition `PREPARED/AUTHORIZED → SIGNED` bắt buộc provider transaction ID.
- Complete nay bắt buộc thêm `resultArtifactKey` và SHA-256 hợp lệ; domain test đạt 5/5, tránh ghi nhận signed khi chưa có PDF output.
- Complete giới hạn artifact key ở `documents/*.pdf` và ghi audit success/failure kèm hash trước/sau; domain test vẫn đạt 5/5.
- Có endpoint audit/read request và test tách quyền audit khỏi quyền sign.
- Cancel request ghi audit `SIGNATURE_CANCELLED` với actor/document/session/request; domain test kiểm tra actor audit.
- Regression suite signing/placeholder/client đạt 16/16; backend typecheck đạt sau các thay đổi session cancel, overlap và artifact validation.
- Có script `services/pdf-signing/scripts/smoke-pades.ps1` để chạy health→sign→lưu PDF output khi Docker/provider sẵn sàng; provider thiếu sẽ dừng với exit code 2 và không đánh dấu pass.
- Smoke script tạo thêm `smoke-tampered.pdf`; validator độc lập phải xác nhận bản này invalid trước khi đóng tamper gate.
- Smoke tự gọi `pdfsig` nếu có; nếu không có validator, kết quả được ghi `NOT_VERIFIED`, không được coi là pass.
- Compose đã sửa để provider `test` không bị fail do thiếu secret PFX; provider `pkcs12` mới bắt buộc mount `secrets/signing.pfx`.
- Compose truyền `NODE_ENV`; production guard sẽ làm readiness fail nếu provider vẫn là `test`.
- Runbook nghiệm thu runtime được tạo tại `PAdES_RUNTIME_ACCEPTANCE_RUNBOOK.md`, bao gồm pass criteria, production guard và evidence policy.
- CI workflow đã thêm Python compile, Signing Service contract test và Docker Compose config validation.
- CI path filter đã bao gồm `services/pdf-signing/**`, không bỏ sót thay đổi Signing Service.
- CI build Docker image `vimes-pdf-signing:ci` để kiểm tra Dockerfile/dependency trước staging.
- CI khởi động image với provider test, gọi `/ready` tối đa 40 giây và cleanup container tự động.
- CI negative test xác nhận production + provider test trả HTTP 503.
- Runtime blocker được ghi rõ tại `DS02_RUNTIME_BLOCKER.md`; không đánh dấu PAdES pass khi chưa có Docker/provider/validator evidence.
- Docker đã chạy; PKCS#12 provider đã sign synthetic PDF thành công, evidence tại `staging-evidence/PG-11/2026-08-12/`.
- Independent pyHanko validation với test certificate làm trust anchor: signed PDF `VALID`, tampered PDF `INVALID`; chữ ký bao phủ toàn bộ file và dùng SHA-256/RSA.
- HIS Backend có `/api/v1/signatures/health` proxy tới Signing Service readiness cho dashboard/operations.
- Signing client test readiness metadata đạt; tổng client/domain/permission regression suite hiện đạt 17/17.
- `PadesProvider` hiện implement certificate metadata contract và fail-closed `sign_digest`; remote/HSM two-phase adapter phải thay method này, không dùng nhầm SimpleSigner cho digest tùy ý.
- Signing Service có `/v1/provider-info` để hiển thị certificate metadata an toàn trước khi ký; không expose private key/PIN/PFX.

## Chưa đạt production

Cần chạy container với test certificate, validate PDF bằng validator độc lập, tamper test và tích hợp HSM/USB Token/Remote CA trước khi đánh dấu PAdES B-T/B-LT đạt.
