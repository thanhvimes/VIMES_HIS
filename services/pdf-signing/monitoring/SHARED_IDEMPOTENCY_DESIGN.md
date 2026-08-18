# Shared idempotency design (production)

Use Redis or PostgreSQL so all signing replicas share the same result.

Required record:

- `idempotency_key` (unique, max 128 chars)
- request fingerprint (SHA-256 of canonical request)
- status: `IN_PROGRESS|SUCCEEDED|FAILED`
- result artifact key/hash
- request ID, created/expiry timestamps

Behavior:

1. First request atomically creates `IN_PROGRESS` with a short lease.
2. Same key + same fingerprint waits/returns the existing result.
3. Same key + different fingerprint returns `409 IDEMPOTENCY_KEY_REUSE`.
4. Expired `IN_PROGRESS` may be reclaimed after provider timeout.
5. Records are retained according to document audit/retention policy.

The current in-memory dictionary is staging-only and must not be used for multi-replica production.
