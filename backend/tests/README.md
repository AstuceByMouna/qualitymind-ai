# Backend QA test architecture (QA-73)

The goal is to keep the test pyramid **clear and extensible**, without
artificially increasing the number of tests. All 35 existing collected cases
are preserved; the current structure is deliberately simple.

| Directory | Cases | Scope | Dependency |
| --- | ---: | --- | --- |
| `unit/` | 6 | Pydantic input normalization and validation | Python only |
| `api/` | 14 | FastAPI contract, OpenAPI, CORS, health; DB mocks where needed | In-process `TestClient` |
| `integration/` | 15 | Contract **plus actual PostgreSQL** (including pagination, reads, writes) | `qualitymind_test` |

## Running tests (from `backend/`)

Unit and isolated API checks (safe without a live PostgreSQL service):

```bash
python -m pytest tests/unit -v
python -m pytest tests/api -v
```

Integration tests use **real DB persistence**. **Never run against the dev
database**. Start the DB from the repository root and configure test DB:

```bash
docker compose up -d db
cd backend
source .venv/Scripts/activate  # Windows Git Bash
export POSTGRES_DB=qualitymind_test
python -c "from app.db import engine; assert engine.url.database == 'qualitymind_test'"
python -m alembic upgrade head
python -m pytest tests/integration -v
python -m pytest -v
```

The two integration test modules explicitly reject collection unless
`POSTGRES_DB=qualitymind_test` is set, and the database-aware cases verify
the selected database. This is a **fail-fast protection** against accidental
writes to the development DB. `pytest --collect-only` on the entire suite
requires the same variable.

## Automatic markers

`tests/conftest.py` marks every test according to its directory. You can run:

```bash
python -m pytest tests/unit
python -m pytest tests/api
python -m pytest tests/integration
python -m pytest -m unit
python -m pytest -m api
python -m pytest -m integration
```

**Important:** `-m unit` still collects all folders before selecting; when
the integration guard is not configured use the **directory form** above.
`-m` is most useful in the dedicated test DB environment.

## Design and CI guidelines

- Unit tests never require network/DB. Favor pure business functions and schema rules.
- API tests use HTTP status, body/schema, and CORS assertions; mocks prove
  HTTP behavior but **not** SQL persistence.
- Integration tests verify real database effects. Create unique records and
  delete only those created by the test. Do not depend on test execution order.
- Existing `backend-ci.yml` runs `python -m pytest -v`; no workflow rewrite
  is needed for this move. Confirm 35 collected and 35 passing in the PR.
- `pytest-cov` is local-only until it is declared in a pinned/dev dependency
  file; do not claim CI coverage measurement.
- A future `automation/playwright/` project tests the actual Next.js UI;
  Postman CLI covers shared HTTP collection regression without replacing Pytest.
- As AI modules emerge, extend with isolated contract tests and a separate
  `evaluation/` layer for nondeterministic model outputs and datasets.
