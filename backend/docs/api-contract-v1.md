# Requirements API v1 — QA-60

The versioned HTTP API is the contract for the future Next.js client.

| Verb | Path | Response |
| --- | --- | --- |
| GET | `/health` | 200 — `{"status":"ok"}` |
| POST | `/api/v1/requirements` | 201 — `RequirementRead` |
| GET | `/api/v1/requirements?limit=50&offset=0` | 200 — `RequirementListResponse` |
| GET | `/api/v1/requirements/{id}` | 200 — `RequirementRead`; 404 if absent; 422 if UUID invalid |

## Pagination

- `limit`: default 50, minimum 1, maximum 200.
- `offset`: default 0, minimum 0.
- Sorted by `created_at DESC, id DESC` to provide a deterministic order.
- List response: `{"items": [...], "total": 125, "limit": 50, "offset": 0}`.
- `total` counts all requirements, before pagination.
- Offset pagination is sufficient for the MVP; cursor pagination can be added in a future version if data volumes require it.

## Architecture

`main.py` is the FastAPI composition root. `api/v1/requirements.py` exposes the HTTP contract and translates domain not-found errors into HTTP 404. `modules/requirements/application/service.py` owns the use case interface; `domain` defines framework-independent entities and ports; `infrastructure/repository.py` adapts the existing SQLAlchemy model and commits writes.

This modular structure is an extraction seam, not a microservice. Future changes involving multiple writes should introduce explicit unit-of-work transaction boundaries.

## Migration notes

The old unversioned routes `/requirements` are removed from the new public API contract. Update Postman collection after the API corrections are merged. Database schema and Alembic migrations are unchanged in QA-60.

Separate tickets: E2 CORS (QA-61), E3 DB configuration (QA-62), M1 input validation (QA-63), M2 test coverage (QA-64).
