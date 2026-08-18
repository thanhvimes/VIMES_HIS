# Shared idempotency SQL runbook

1. Apply migration `backend/migrations/053_hms_document_signature_idempotency.sql`.
2. On request, insert `IN_PROGRESS` with `INSERT ... ON CONFLICT DO NOTHING`.
3. Read the existing row and compare `request_fingerprint`.
4. Same fingerprint: wait/return existing result; different fingerprint: return `409`.
5. Reclaim only rows whose lease expired; never reclaim `SUCCEEDED`.
6. Purge rows after `expires_at` according to audit retention policy.

The table stores hashes/metadata only, never PDF bytes, CMS, private keys, PINs or PHI.
