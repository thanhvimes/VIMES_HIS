# Signing capacity planning

## Staging baseline (2026-08-13)

- Concurrency 2: 5.52 RPS, p50 319 ms, p95 417 ms.
- Concurrency 4, 100 requests: 6.60 RPS, p50 588 ms, p95 751 ms, p99 871 ms.
- Concurrency 20 spike with guard 4: successful requests are bounded; excess requests receive HTTP 429.

These numbers are synthetic staging evidence, not a production SLA.

## Production procedure

1. Run the same test with the approved provider and representative PDF sizes.
2. Increase `SIGNING_MAX_CONCURRENCY` gradually while watching CPU, memory, provider quota and p95/p99.
3. Stop when SLA or provider quota is reached; keep headroom for clinical traffic.
4. Scale horizontally only after idempotency is moved to Redis/PostgreSQL shared storage.
