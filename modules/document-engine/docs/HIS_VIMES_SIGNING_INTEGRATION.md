# HIS → VIMES Signing Server integration

## Configuration

```env
VIMES_SIGNING_URL=http://127.0.0.1:8082
VIMES_SIGNING_TIMEOUT_MS=60000
```

## Authenticated HIS test endpoint

```http
POST /api/health-check/documents/sign-pdf-vimes
X-Request-ID: REQ-001
```

```json
{
  "pdfBase64": "<synthetic PDF base64>",
  "pageIndex": 0,
  "x1Pt": 36,
  "y1Pt": 36,
  "x2Pt": 180,
  "y2Pt": 90,
  "fieldName": "DoctorSignature",
  "reason": "Medical document signing",
  "idempotencyKey": "DOC-001-SIGN-1"
}
```

## Error mapping

| Signing Server | HIS error |
|---:|---|
| 413 | `SIGNING_PDF_SIZE_LIMIT` |
| 429 | `SIGNING_CONCURRENCY_LIMIT` |
| 503 | `SIGNING_PROVIDER_UNAVAILABLE` |
| timeout | `SIGNING_TIMEOUT` |
| invalid rectangle | `INVALID_SIGNATURE_RECTANGLE` |

The existing HMS/XML route remains unchanged. This endpoint is for PDF/PAdES integration testing.

## Smoke test

```powershell
powershell -File backend/scripts/smoke-vimes-signing.ps1
```

The script sends the synthetic discharge-summary PDF through HIS, writes the signed artifact and prints its SHA-256. Do not use patient data.
