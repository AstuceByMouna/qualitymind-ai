# QA-128 — QualityMind self-test SUT and NFR baseline

[QA-128](https://gharbiconsulting.atlassian.net/browse/QA-128) · [Campaign plan](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/4259990) · [NFR catalogue](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145)

## Workspace and startup

The launcher checks the application source against `fda962e0b450e8b9f42dc5e5cf593c76213edd23`. Its API emits this SHA on each response. Use the same revision of the application files for reproduction. A fresh checkout keeps the owner's checkout, stashes and QA services independent.

```powershell
git --no-optional-locks status --short --branch
git stash list
git ls-remote origin refs/heads/main refs/heads/feature/QA-128-self-test-sut
git clone --single-branch --branch feature/QA-128-self-test-sut https://github.com/AstuceByMouna/qualitymind-ai.git ..\qualitymind-sut
Set-Location ..\qualitymind-sut
git rev-parse HEAD
```

Use the dependencies listed in `backend/requirements.txt` and `frontend/package-lock.json`. This run reused existing Python and Node dependencies, including the locally cached `postgres:17` image. The Compose policy requires an existing image and performs no pull. Use a separate clone with no DEV or QA credentials. The init command creates a local ignored `.env.sut` with a generated secret. Run init once and keep the file alongside the dedicated volume.

```powershell
$python = ".\backend\.venv\Scripts\python.exe"
& $python -B scripts/sut_env.py preflight
& $python -B scripts/sut_env.py init
& $python -B scripts/sut_env.py db-up
& $python -B scripts/sut_env.py migrate
& $python -B scripts/sut_env.py check
```

Run these two long-lived commands in distinct terminals, each at the SUT checkout root.

```powershell
.\backend\.venv\Scripts\python.exe -B scripts/sut_env.py api
.\backend\.venv\Scripts\python.exe -B scripts/sut_env.py frontend
```

The launcher inspects the published loopback binding and volume then queries the identity of the database and role before migration or test. SUT uses PostgreSQL `127.0.0.1:5434`, database and role `qualitymind_sut`, API `8002`, UI `3002`, Next directory `.next-sut`, project `qualitymind-sut` and volume `qualitymind-sut_sut_pgdata`. Next's font requests were substituted with an existing test font fixture for the observed run. This has no bearing on API latency.

## Measurement and restart

Seed only on a fresh, empty dedicated database. The checks verify the exact inventory of 40 synthetic requirements.

```powershell
& $python -B scripts/sut_baseline.py seed
$before = (& $python -B scripts/sut_baseline.py smoke | ConvertFrom-Json).fixture_id
& $python -B scripts/sut_baseline.py benchmark
```

Stop the two SUT processes using Ctrl+C in their owning terminals. Run `& $python -B scripts/sut_env.py db-stop` and `& $python -B scripts/sut_env.py db-up`. Restart the API and UI with the same commands, wait for readiness, and run `& $python -B scripts/sut_baseline.py smoke --expected-id $before`. Shut down the API and UI with Ctrl+C and run `db-stop` again. The volume and fixtures remain available.

Observed on Windows 11 build 26300, Intel i7-11370H, 4 cores/8 logical processors, 16.9 GB physical RAM, Docker Desktop, PostgreSQL 17.11, Python 3.14 and Node 24. Local HTTPX closed-loop mix with 20 ms worker pacing, 3 s request timeout and no retries. Four equally weighted API paths: health, Requirements list (20/page), detail and search (one match). Warm-up: 40 requests, 1 worker, 1.304 s. Percentiles use successful requests and nearest rank.

| Workers | Duration (s) | Requests | p50 / p95 / p99 (ms) | Requests/s | Error rate |
| --- | ---: | ---: | --- | ---: | ---: |
| 1 | 2.453 | 80 | 10.56 / 15.38 / 18.48 | 32.61 | 0% |
| 2 | 2.827 | 160 | 12.62 / 28.10 / 80.87 | 56.60 | 0% |
| 4 | 2.655 | 320 | 11.86 / 23.28 / 27.83 | 120.51 | 0% |

[Sanitized per-endpoint measurements](qa-128-sut-measurement.json). Performance script exit 0. All measured endpoint p99 values were below 2 seconds in this limited profile (highest 108.44 ms, search at two workers). These results characterize the pinned local build and small dataset. Sustained, cold-start, larger datasets and remote-client latency remain unmeasured. No blocking performance gate.

Migration, seed, pre-restart smoke, post-restart smoke and shutdown all exited 0. The same synthetic record UUID and title were observed before and after restarting PostgreSQL, FastAPI and Next.js. Search returned the expected record and the detail rendered through the UI after restart. Manual owner acceptance: NOT_RUN.
