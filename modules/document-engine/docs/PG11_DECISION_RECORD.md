# PG-11 decision record

## Decision

**NO-GO for production / STAGING READY**

## Rationale

The implementation, synthetic signing, tamper validation, security hardening, observability, load baselines and CI gates are complete for staging. Production approval is intentionally withheld because the approved signing provider and CA dependencies have not been supplied and independently validated.

## Required evidence to change to GO

1. Approved HSM/USB Token/Remote CA with documented SLA.
2. Production certificate/trust chain and key-usage validation.
3. Working TSA, OCSP and CRL endpoints with outage evidence.
4. Vault/KMS secret injection, rotation and access review.
5. Production load/spike/soak report.
6. Clinical, Security, Infrastructure and Legal approval.
7. Rollback and recovery drill.

Until all seven items are evidenced, do not use the test certificate for clinical records.
