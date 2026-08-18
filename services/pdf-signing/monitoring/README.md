# Signing service monitoring

1. Merge `prometheus-scrape.yml` into Prometheus `scrape_configs`.
2. Load `prometheus-rules.yml` through `rule_files`.
3. Scrape `/metrics/prometheus` every 15 seconds.
4. Route alerts to the hospital SRE/on-call channel.

Configured alerts:

- Signing error rate above 1% for 5 minutes.
- Average signing latency above 3 seconds for 10 minutes.
- More than 10 size rejections in 10 minutes.
- Certificate expiry within 30 days.
- Concurrency rejection exceeds 20 requests in 5 minutes.

When concurrency rejection fires: verify provider latency, inspect queue depth, scale signing workers within the approved limit, then rerun the synthetic load test.

See `CAPACITY_PLANNING.md` for staging baselines and production scale-up procedure.

Do not expose the metrics endpoint publicly without network policy/authentication.
