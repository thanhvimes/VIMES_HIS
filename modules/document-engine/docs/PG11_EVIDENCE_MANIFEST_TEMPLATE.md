# PG-11 evidence manifest template

```yaml
gate: PG-11
run_date: YYYY-MM-DD
environment: staging|production
service_version: ""
provider: hsm|pkcs11|local-agent|remote-ca
profile: PAdES-B-T|PAdES-B-LT|PAdES-B-LTA
input_sha256: ""
signed_output_sha256: ""
tampered_output_sha256: ""
signed_validation: VALID
tampered_validation: INVALID
tsa_url: ""
ocsp_url: ""
crl_url: ""
certificate_fingerprint: ""
load_test_report: ""
reviewers:
  clinical: ""
  security: ""
  infrastructure: ""
  legal: ""
decision: GO|NO-GO
notes: ""
```

Do not store private keys, PINs, OAuth secrets or PHI in the manifest.
