# Signing provider production intake

## Provider

- Provider type: `[ ] HSM PKCS#11  [ ] USB Token/Local Agent  [ ] Remote CA`
- Vendor/product and version:
- Environment/network zone:
- Approved SLA (latency, availability, throughput):

## Connectivity

- Endpoint or PKCS#11 library path:
- mTLS/OAuth mechanism (secret values are injected separately):
- Timeout/retry/rate limit:
- HA/failover endpoint:

## Certificate and trust

- Certificate subject/serial/fingerprint:
- Valid from / expires:
- Trust chain delivery location:
- Key usage includes `digitalSignature` and `nonRepudiation`: `[ ] Yes [ ] No`
- TSA RFC 3161 endpoint:
- OCSP endpoint:
- CRL distribution point:

## Acceptance evidence

- Signed PDF validates in Adobe/independent validator: `[ ]`
- Tampered PDF is rejected: `[ ]`
- TSA outage/timeout behavior tested: `[ ]`
- Certificate rotation/expiry alert tested: `[ ]`
- Load test report attached: `[ ]`
- Clinical/Security/Infrastructure/Legal reviewers:

Never put private keys, PINs, OAuth secrets or patient data in this form.
