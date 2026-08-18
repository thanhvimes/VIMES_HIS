"""Synthetic signing load test; never use patient data."""
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import statistics
import time
from pathlib import Path

import httpx


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8082")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--requests", type=int, default=20)
    parser.add_argument("--concurrency", type=int, default=4)
    args = parser.parse_args()
    payload_pdf = base64.b64encode(args.input.read_bytes()).decode()
    sem = asyncio.Semaphore(args.concurrency)
    latencies: list[float] = []
    errors = 0
    rejected = 0

    async def one(client: httpx.AsyncClient) -> None:
        nonlocal errors, rejected
        async with sem:
            payload = {"pdf_base64": payload_pdf, "field_name": "LOAD_TEST", "page_index": 0, "x1_pt": 36, "y1_pt": 36, "x2_pt": 180, "y2_pt": 90}
            started = time.perf_counter()
            try:
                response = await client.post("/v1/sign-pdf", json=payload)
                elapsed = (time.perf_counter() - started) * 1000
                if response.status_code == 200:
                    latencies.append(elapsed)
                elif response.status_code == 429:
                    rejected += 1
                else:
                    errors += 1
            except httpx.HTTPError:
                errors += 1

    started = time.perf_counter()
    async with httpx.AsyncClient(base_url=args.base_url, timeout=60) as client:
        await asyncio.gather(*(one(client) for _ in range(args.requests)))
    duration = time.perf_counter() - started
    ordered = sorted(latencies)
    percentile = lambda p: ordered[min(len(ordered) - 1, int(len(ordered) * p / 100))] if ordered else None
    print(json.dumps({"requests": args.requests, "success": len(latencies), "rejected_429": rejected, "errors": errors, "duration_seconds": round(duration, 3), "throughput_rps": round(len(latencies) / duration, 2) if duration else 0, "p50_ms": percentile(50), "p95_ms": percentile(95), "p99_ms": percentile(99)}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
