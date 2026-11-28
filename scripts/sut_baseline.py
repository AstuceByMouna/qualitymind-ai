"""Bounded local benchmark and restart checks for the QA-128 self-test SUT."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import math
from pathlib import Path
import time

import httpx

from sut_env import API, BASELINE, UI, check_database, ensure_pinned_sources

PREFIX = "QA128 synthetic "
COUNT = 40
LIST = "/api/v1/requirements"


def request(client, method, path, expected=200, **kwargs):
    response = client.request(method, API + path, **kwargs)
    if response.status_code != expected or response.headers.get("x-qualitymind-sut-sha") != BASELINE:
        raise RuntimeError(f"Unexpected response from SUT {method} {path}: {response.status_code}")
    return response.json()


def smoke(client):
    assert request(client, "GET", "/health") == {"status": "ok"}
    result = request(client, "GET", LIST + "?limit=50")
    rows = result["items"]
    if result["total"] != COUNT or len(rows) != COUNT or {item["title"] for item in rows} != {
        f"{PREFIX}{index:02}" for index in range(COUNT)
    }:
        raise RuntimeError("Unexpected synthetic fixture inventory")
    fixture = next(item for item in rows if item["title"] == PREFIX + "00")
    assert request(client, "GET", LIST + "/" + fixture["id"])["title"] == fixture["title"]
    matches = request(client, "GET", LIST, params={"q": PREFIX + "00"})
    assert [item["id"] for item in matches["items"]] == [fixture["id"]]
    response = client.get(UI + "/requirements/" + fixture["id"])
    assert response.status_code == 200 and fixture["title"] in response.text
    return fixture["id"]


def profile(client, endpoints, concurrency, requests_per_worker):
    def worker(number):
        observations = []
        for offset in range(requests_per_worker):
            name, path = endpoints[(offset + number) % len(endpoints)]
            start = time.perf_counter()
            try:
                request(client, "GET", path)
                ok = True
            except (httpx.HTTPError, RuntimeError):
                ok = False
            observations.append((name, ok, (time.perf_counter() - start) * 1000))
            time.sleep(0.02)
        return observations

    start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        samples = [item for batch in executor.map(worker, range(concurrency)) for item in batch]
    seconds = time.perf_counter() - start

    def metrics(group):
        durations = sorted(latency for _, ok, latency in group if ok)
        def percentile(value):
            return round(durations[math.ceil(value * len(durations)) - 1], 2) if durations else None
        return {"requests": len(group), "errors": len(group) - len(durations),
                "error_percent": round(100 * (1 - len(durations) / len(group)), 2),
                "p50_ms": percentile(.5), "p95_ms": percentile(.95), "p99_ms": percentile(.99),
                "requests_per_second": round(len(group) / seconds, 2)}

    return {"concurrency": concurrency, "duration_seconds": round(seconds, 3),
            "overall": metrics(samples),
            "endpoints": {name: metrics([item for item in samples if item[0] == name]) for name, _ in endpoints}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["seed", "smoke", "benchmark"])
    parser.add_argument("--expected-id", help="Expected synthetic record ID after restart")
    args = parser.parse_args()
    ensure_pinned_sources()
    version = check_database()
    with httpx.Client(timeout=3, trust_env=False) as client:
        assert request(client, "GET", "/health") == {"status": "ok"}
        if args.command == "seed":
            if request(client, "GET", LIST)["total"] != 0:
                raise RuntimeError("Seed expects an empty SUT database")
            for index in range(COUNT):
                request(client, "POST", LIST, 201, json={
                    "title": f"{PREFIX}{index:02}", "description": "Synthetic self-test requirement.",
                })
        fixture_id = smoke(client)
        if args.expected_id and fixture_id != args.expected_id:
            raise RuntimeError("Synthetic record identity changed after restart")
        if args.command != "benchmark":
            print(json.dumps({"fixture_id": fixture_id, "dataset_size": COUNT, "application_sha": BASELINE}))
            return
        endpoints = [("health", "/health"), ("list", LIST + "?limit=20"),
                     ("details", LIST + "/" + fixture_id), ("search", LIST + "?q=QA128%20synthetic%2000")]
        warmup = profile(client, endpoints, 1, 40)
        if warmup["overall"]["errors"]:
            raise RuntimeError("Warm-up encountered errors")
        stages = [profile(client, endpoints, concurrency, 80) for concurrency in (1, 2, 4)]
        print(json.dumps({"dataset_size": COUNT, "application_sha": BASELINE,
                          "postgresql_version": version, "warmup": warmup, "stages": stages}, indent=2))
        if any(stage["overall"]["errors"] for stage in stages):
            raise SystemExit(1)


if __name__ == "__main__":
    main()
