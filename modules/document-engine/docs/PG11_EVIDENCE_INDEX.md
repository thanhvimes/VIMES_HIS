# PG-11 evidence index

## Runtime evidence

- Staging signed/tampered PDFs: `staging-evidence/PG-11/2026-08-12/`
- Signing service evidence: `DS02_SIGNING_SERVICE_EVIDENCE.md`
- Validator: `services/pdf-signing/scripts/validate-pades.py`
- Load test: `services/pdf-signing/scripts/load_test.py`

## Production preparation

- Main checklist: `SIGNING_PROVIDER_PRODUCTION_CHECKLIST.md`
- Intake form: `SIGNING_PROVIDER_INTAKE_FORM.md`
- Blocker tracker: `PG11_PRODUCTION_BLOCKER_TRACKER.md`
- Execution runbook: `PRODUCTION_PROVIDER_EXECUTION_RUNBOOK.md`
- Evidence manifest: `PG11_EVIDENCE_MANIFEST_TEMPLATE.md`
- Failure matrix: `services/pdf-signing/monitoring/PROVIDER_FAILURE_MATRIX.md`
- Capacity planning: `services/pdf-signing/monitoring/CAPACITY_PLANNING.md`

## Monitoring and security

- Prometheus scrape: `services/pdf-signing/monitoring/prometheus-scrape.yml`
- Prometheus rules: `services/pdf-signing/monitoring/prometheus-rules.yml`
- Monitoring guide: `services/pdf-signing/monitoring/README.md`
- Container security scan: `services/pdf-signing/scripts/check-container-security.ps1`
- Sensitive log scan: `services/pdf-signing/scripts/scan-sensitive-logs.ps1`
- Production config gate: `services/pdf-signing/scripts/validate-production-config.ps1`
- Next-session checklist: `PG11_NEXT_SESSION_CHECKLIST.md`
- Decision record: `PG11_DECISION_RECORD.md`

Current decision: **STAGING READY / PRODUCTION NO-GO**.
