# QualityMind AI

**Enterprise AI-Powered Quality Engineering Platform**

QualityMind AI is an open-source portfolio project designed to demonstrate enterprise-level Quality Engineering, AI-assisted testing, risk-based testing, test automation, and quality governance.

## Project Objectives

- Centralize and analyze software requirements.
- Generate AI-assisted test case proposals.
- Prioritize testing activities based on risk.
- Integrate API and UI test automation.
- Analyze test failures using AI.
- Evaluate deterministic Quality Gates.
- Provide explainable quality dashboards and release recommendations.

## Architecture

QualityMind AI follows a modular monolith architecture.

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | Next.js, React |
| Database | PostgreSQL |
| AI Integration | OpenAI API, Structured Outputs, Pydantic |
| API Testing | Pytest, HTTPX |
| UI Automation | Playwright |
| CI/CD | GitHub Actions |
| Observability | OpenTelemetry (planned) |

These technologies form the target architecture. Their implementation is incremental.

## Main Modules

1. Requirements Intelligence
2. AI Test Design
3. Risk-Based Testing
4. Automation Hub
5. Intelligent Failure Analysis
6. Quality Governance

## System Under Test

The reference application for demonstrating QualityMind AI will be **RealWorld (Conduit)**, an open-source application with authentication, articles, comments, and REST APIs.

Repository: https://github.com/gothinkster/realworld

## Development Workflow

Every change follows the project SDLC:

1. Jira issue and acceptance criteria.
2. Dedicated Git branch.
3. Implementation and local validation.
4. Commit and Pull Request.
5. Code review and applicable quality checks.
6. Merge into `main`.
7. Update Jira and Confluence.

## Branch protection and CI Quality Gates (QA-66)

The default branch `main` is protected by the active GitHub repository ruleset
[Protect main — Quality Gates](https://github.com/AstuceByMouna/qualitymind-ai/rules/26914184).

- All changes to `main` must go through a pull request.
- The required GitHub Actions job is **FastAPI / Pytest / PostgreSQL** (workflow: `.github/workflows/backend-ci.yml`).
- The required check runs for every PR targeting `main`, including documentation-only PRs, so it is not left permanently pending because of path filters.
- Review approval count is currently **0** because the project has one maintainer; all review conversations must be resolved before merging.
- Force pushes and deletion of `main` are blocked.
- There are no bypass actors configured.

Before merging a PR: verify its diff, check the GitHub Actions run, ensure the required check succeeds, and resolve review conversations. A failing or missing required check should prevent merging via the normal GitHub workflow. Verify that the Ruleset is effectively enforced with a documentation-only PR and a controlled negative test before considering QA-66 fully validated.

## Project Documentation

- [Requirements Catalogue](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145)
- [Architecture Decisions](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458771)
- [SDLC and Git Workflow](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458753)
- [QA Strategy](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/425986)

Some Confluence pages may require authorized access.

## Development Status

**Sprint 1 — Technical Foundations**

- Repository structure initialized.
- Development workflow documented.
- FastAPI backend implementation pending.
- Automated testing and CI/CD pending.

## Local Setup

### Prerequisites

- Python 3.14
- Docker Desktop (with Docker Compose)
- Git

The commands below are written for Windows Git Bash.

### 1. Configure environment variables

From the repository root, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Choose a local PostgreSQL password. In `.env`, use the **same password** in `POSTGRES_PASSWORD` (used by Docker Compose) and in `DATABASE_URL` (used by the backend).

Example configuration (replace `change_me` with your local secret):

```dotenv
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql+psycopg://qualitymind:change_me@127.0.0.1:5432/qualitymind
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Never commit your actual `.env`. If your database volume already exists, changing `POSTGRES_PASSWORD` alone does **not** reset the existing PostgreSQL user's password.

### 2. Start PostgreSQL

From the repository root:

```bash
docker compose up -d db
docker compose ps
```

### 3. Install backend dependencies

```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 4. Apply migrations and start the API

From `backend`:

```bash
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m uvicorn app.main:app --reload
```

- Swagger API documentation: http://127.0.0.1:8000/docs
- Health endpoint: http://127.0.0.1:8000/health

### 5. Create an isolated test database and run tests

The integration tests require a separate PostgreSQL database named `qualitymind_test`. Create it once from the repository root:

```bash
docker compose exec db psql -U qualitymind -d qualitymind -c "CREATE DATABASE qualitymind_test;"
```

If the database already exists, skip that creation command. In `backend`, apply migrations to the **test** database and run the suite:

```bash
POSTGRES_DB=qualitymind_test .venv/Scripts/python.exe -m alembic upgrade head
POSTGRES_DB=qualitymind_test .venv/Scripts/python.exe -m pytest tests/ -v
```

The `POSTGRES_DB` override changes only the database name for the backend connection. Keep it set to `qualitymind_test` for both migration and test commands. **Never run integration tests against development or production data.**

### Database configuration

- `DATABASE_URL` is the preferred SQLAlchemy connection setting. Use `postgresql+psycopg://` to select the installed psycopg 3 driver.
- `POSTGRES_PASSWORD` configures the Docker PostgreSQL container and must match the password embedded in `DATABASE_URL`.
- `POSTGRES_DB=qualitymind_test` selects the isolated test database without changing connection credentials.
- `CORS_ORIGINS` contains comma-separated frontend origins allowed to access the API from a browser.

## Postman cloud collection CI (QA-67)

The Postman collection is hosted in the Postman Cloud and runs in the separate GitHub Actions workflow [Postman API CI](.github/workflows/postman-ci.yml). It does **not** require repetitive JSON exports.

Collection ID: `14273198-16be7483-92c9-443d-b79c-b202e056a82e`.

The workflow starts PostgreSQL 17 with an isolated `qualitymind_test` database, applies Alembic migrations, starts FastAPI, waits for `/health`, and runs the cloud collection using the official Postman CLI GitHub Action.

**One-time configuration (repository administrators):**

1. In GitHub **Settings → Secrets and variables → Actions → Secrets**, create the repository secret `POSTMAN_API_KEY` containing a Postman API key authorized to read the collection. Never commit or paste this key into code, chat, logs, or the README.
2. In Postman, configure the collection requests to use the variable `{{baseUrl}}` for the API host, and include assertions for expected response codes and data. The CI overrides `baseUrl` with `http://127.0.0.1:8000`. Review the collection for fixed URLs, external dependencies, and destructive requests before enabling it.
3. After the collection is verified, in GitHub **Settings → Secrets and variables → Actions → Variables**, create repository variable `POSTMAN_CI_ENABLED` with value `true`.
4. Open a PR or run the **Postman API CI** workflow manually from the Actions tab, then verify the job result. If the flag is not `true`, the job is skipped by design.

The Postman CI check is **not yet required** by the `main` Ruleset; only the backend Pytest check is required. Make it mandatory in a separate approved change after the first successful collection run and secret configuration.

## Security

Never commit real passwords, tokens, API keys, or local `.env` files.

Use `.env.example` as a configuration template.

## License

License selection pending.

---

QualityMind AI — Quality Engineering by Design.