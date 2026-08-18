# Provider failure test matrix

Run after the approved HSM/USB Token/Remote CA is connected.

| Scenario | Expected behavior | Evidence |
|---|---|---|
| Provider timeout | Bounded timeout, no partial PDF, error metric increments | Request ID + response + logs |
| Provider 5xx | Limited retry/backoff, then fail closed | Retry count + final status |
| TSA outage | Do not silently downgrade required PAdES profile | TSA error + no false success |
| OCSP/CRL unavailable | Follow approved revocation policy; alert | Validation output |
| Provider failover | New request succeeds on secondary, no duplicate signature | Idempotency/audit record |
| Client retry after timeout | Same `X-Idempotency-Key` returns same result, no duplicate signing/audit event | Shared-store record + hashes |
| Certificate expired | Readiness 503 and alert | `/ready`, `/v1/provider-info` |

Never mark a provider failure test passed using the `test` provider.
