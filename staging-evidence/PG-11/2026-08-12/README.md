# PG-11 staging signing evidence

- Provider: PKCS#12 test certificate, `vimes-pdf-signing-pkcs12`.
- Endpoint: `http://127.0.0.1:8082/v1/sign-pdf`.
- Input: synthetic `DISCHARGE_SUMMARY` test-run PDF.
- Output: `pg11-signed.pdf`.
- Signed SHA-256: `61B0BF4DE671A950E90EE4734E375FC79A31383A584F5233E305A20A3256BE8C`.
- Tampered fixture: `pg11-tampered.pdf`.
- Tampered SHA-256: `99B223044D8EE0439C528CB6E8A9DB789B656EAA804714A53121AFB01F6C0745`.
- Provider readiness: HTTP 200, `provider=pkcs12`, profile `PAdES-B-T`.
- Certificate metadata endpoint: HTTP 200; subject/issuer `VIMES HIS TEST ONLY`.
- pyHanko structural check: signed PDF contains 1 embedded signature field `SIG_SMOKE`.
- Independent pyHanko validation with the generated test certificate as trust anchor: signed PDF `VALID` (cryptographically sound, SHA-256/RSA, covers entire file); tampered PDF `INVALID` (cryptographically unsound).

## Scope

Đây là evidence staging với chứng thư test tự ký; không dùng chứng thư này cho hồ sơ bệnh viện. Bước tiếp theo là lặp lại cùng quy trình với HSM/USB Token/Remote CA và validator có trust chain production.
