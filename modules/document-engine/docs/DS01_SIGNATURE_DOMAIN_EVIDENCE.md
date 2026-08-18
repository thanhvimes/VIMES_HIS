# DS-01 Signature domain evidence

Migration `backend/migrations/052_hms_document_digital_signature.sql` defines the first production domain layer for PDF signing:

- `hms_document_signature_placeholder`: immutable template-version regions, PDF-point geometry, role and signing order.
- `hms_document_signing_session`: source/result artifact, document hash, expiry, status and optimistic row version.
- `hms_document_signature_request`: `FREESTYLE`/`PLACEHOLDER`, coordinates, signer, idempotency key and provider transaction.
- `hms_document_signature_audit`: append-only actor/result/hash/certificate/TSA evidence.

The migration includes foreign keys to template/version, rectangle and rotation constraints, uniqueness for placeholder code/field, idempotency uniqueness per session, indexes for session/request/audit lookup and comments prohibiting private keys/PIN/raw PHI in audit data.

`backend/src/document-signature/signature.repository.ts` and `signature.service.ts` now provide session/request persistence, state transitions, expiry checks, idempotent request creation, rectangle validation and prepare/cancel transitions. Backend `npm run typecheck` passed after this change.

Routes are mounted at `/api/v1/signatures` in `backend/src/routes/document-signature.routes.ts`; the v1 request/response and error contract is documented in `DIGITAL_SIGNATURE_OPENAPI.md`. Permission middleware defaults to enabled and requires `DOCUMENT_SIGNATURE_*` permissions outside tests.

Permission roles and separation are documented in `DIGITAL_SIGNATURE_PERMISSION_MATRIX.md`. Negative middleware tests (`document-signature-permissions.test.ts`) passed 3/3; backend typecheck passed.

Domain validation tests (`document-signature-domain.test.ts`) passed 4/4 for hash/version, placement exclusivity, rectangle bounds and valid request delegation. Combined signature tests passed 7/7.

## Remaining DS-01 work

Domain integration tests against PostgreSQL and the real PAdES provider remain before this gate can be marked complete. The current API intentionally stops at prepare/cancel until a real PAdES provider is integrated; it is not a production signing pass yet.
