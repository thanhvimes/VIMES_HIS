# Digital Signature API contract (v1)

Base path: `/api/v1/signatures`. All endpoints require authenticated HIS user. Permission enforcement is enabled by default with `DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS=true`.

## Health/readiness proxy

`GET /health`

Permission: `DOCUMENT_SIGNATURE_VIEW`. HIS Backend proxies Signing Service `/ready`; returns `503` when provider is not ready and `502` for connection/upstream errors.

Signing Service `GET /v1/provider-info` returns provider and safe certificate metadata only (subject, issuer, serial, expiry, key ID). It never returns private key, PIN or PFX content.

HIS proxy: `GET /provider-info` with `DOCUMENT_SIGNATURE_VIEW`; returns `503` when provider metadata is unavailable and `502` for upstream connection errors.

## Create session

`POST /documents/{documentId}/signing-sessions`

Permission: `DOCUMENT_SIGNATURE_SIGN`

```json
{
  "documentVersion": 3,
  "documentSha256": "64-lowercase-hex-characters",
  "sourceArtifactKey": "documents/encounter-123/v3.pdf",
  "expiresAt": "2026-08-12T12:00:00Z"
}
```

The backend binds the session to the authenticated actor. It rejects a non-positive version or non-SHA-256 hash.

## Get session

`GET /signing-sessions/{sessionId}`

Permission: `DOCUMENT_SIGNATURE_VIEW`.

Returns the session and ordered signature requests.

## Get signature audit

`GET /signing-sessions/{sessionId}/audit`

Permission: `DOCUMENT_SIGNATURE_AUDIT_VIEW`.

Returns append-only events with actor, action, result, hash before/after, artifact metadata and failure code. It never returns private key, PIN or raw CMS.

## Get request

`GET /signature-requests/{requestId}`

Permission: `DOCUMENT_SIGNATURE_VIEW`.

## Placeholder management

`GET /template-versions/{versionId}/placeholders` — `DOCUMENT_SIGNATURE_VIEW`.

`POST /template-versions/{versionId}/placeholders` — `DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE`.

`PUT /placeholders/{placeholderId}` — `DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE`.

`DELETE /placeholders/{placeholderId}` — retire placeholder, never hard-delete a published version.

## Create signature request

`POST /signing-sessions/{sessionId}/requests`

Permission: `DOCUMENT_SIGNATURE_SIGN`.

Required header: `Idempotency-Key: <unique-key>`.

```json
{
  "placementType": "FREESTYLE",
  "pageIndex": 0,
  "x1Pt": 350,
  "y1Pt": 80,
  "x2Pt": 550,
  "y2Pt": 150,
  "pageWidthPt": 595.276,
  "pageHeightPt": 841.89,
  "pageRotation": 0,
  "signerRole": "DOCTOR",
  "reason": "Ký bệnh án"
}
```

For a predefined field use `placementType: "PLACEHOLDER"` and `placeholderId`; the service must load the trusted rectangle from the template version. Client coordinates must not override a placeholder’s stored coordinates.

## Prepare signing

`POST /signature-requests/{requestId}/prepare`

Permission: `DOCUMENT_SIGNATURE_SIGN`.

Returns a short-lived transaction ID. In the production PAdES adapter this endpoint returns the digest/transaction that is sent to USB Token, HSM or Remote CA. The current domain service only creates the transaction state; it does not perform cryptographic signing.

## Cancel signing

`POST /signature-requests/{requestId}/cancel`

Permission: `DOCUMENT_SIGNATURE_SIGN`.

Allowed only before the request is `SIGNED`.

`POST /signing-sessions/{sessionId}/cancel` cancels all open requests and locks the session. It is rejected for `COMPLETED`/already `CANCELLED` sessions.

## Complete signing

`POST /signature-requests/{requestId}/complete`

Permission: `DOCUMENT_SIGNATURE_SIGN`.

```json
{ "providerTransactionId": "remote-ca-or-hsm-transaction-id", "resultArtifactKey": "documents/encounter-123/v4-signed.pdf", "resultArtifactSha256": "64-lowercase-hex-characters" }
```

The backend only transitions `PREPARED`/`AUTHORIZED` to `SIGNED` when provider transaction ID, `documents/*.pdf` artifact key and valid SHA-256 are present. The provider must have already validated the CMS/PAdES output and stored the resulting artifact before this endpoint is called. Success/failure is written to append-only signature audit.

## Error contract

```json
{
  "success": false,
  "message": "Signature rectangle outside page",
  "code": "INVALID_SIGNATURE_RECT"
}
```

Important codes: `IDEMPOTENCY_KEY_REQUIRED`, `SIGNING_SESSION_NOT_FOUND`, `SIGNING_SESSION_EXPIRED`, `SIGNING_SESSION_NOT_WRITABLE`, `INVALID_DOCUMENT_HASH`, `INVALID_SIGNATURE_RECT`, `PLACEHOLDER_REQUIRED`, `SIGNATURE_REQUEST_STATE_CHANGED`.

Placeholder management additionally returns `422 INVALID_PLACEHOLDER_GEOMETRY` for non-numeric values, invalid rotation, negative coordinates or rectangles outside the page. It returns `409 PLACEHOLDER_VERSION_NOT_DRAFT`/`PLACEHOLDER_NOT_EDITABLE` when the template version is published.
It returns `409 PLACEHOLDER_OVERLAP` when a new active region intersects another region on the same page and template version.

## Security requirements

- Never log private key, PIN, PFX password or raw CMS payload.
- Require `If-Match` with the current document version when the final `complete` endpoint is implemented.
- Record actor, IP, correlation ID, source/result hash and certificate/TSA data in append-only audit.
- Return `409` on document version conflict; never silently sign an older artifact.
