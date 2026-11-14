"""Operate isolated local QA services on Windows Git Bash or Unix.

Run with backend's Python virtual environment from the repository root:
    backend/.venv/Scripts/python.exe scripts/qa_env.py db-up
    backend/.venv/Scripts/python.exe scripts/qa_env.py migrate
    backend/.venv/Scripts/python.exe scripts/qa_env.py api
    backend/.venv/Scripts/python.exe scripts/qa_env.py check
    backend/.venv/Scripts/python.exe scripts/qa_env.py db-down

No destructive volume removal is provided. DEV files and DB are untouched.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.error import URLError
from urllib.request import urlopen

from dotenv import dotenv_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
QA_ENV = ROOT / ".env.qa"
QA_NAME = "qualitymind_qa"
QA_API_URL = "http://127.0.0.1:8001"


def get_environment() -> dict[str, str]:
    if not QA_ENV.is_file():
        raise RuntimeError("Missing .env.qa. Copy .env.qa.example to .env.qa and set QA_POSTGRES_PASSWORD.")

    values = dotenv_values(QA_ENV)
    password = values.get("QA_POSTGRES_PASSWORD")
    if not password or password in {"replace_with_a_unique_qa_password", "change_me"}:
        raise RuntimeError("Set a unique QA_POSTGRES_PASSWORD in .env.qa before starting QA.")

    url = URL.create(
        "postgresql+psycopg",
        username=QA_NAME,
        password=password,
        host="127.0.0.1",
        port=5433,
        database=QA_NAME,
    )

    env = os.environ.copy()
    # Explicitly override DEV .env and optional POSTGRES_DB overrides.
    # app.db loads ROOT/.env without override, so the QA URL takes precedence.
    env["DATABASE_URL"] = url.render_as_string(hide_password=False)
    env["POSTGRES_DB"] = QA_NAME
    env["APP_ENV"] = "qa"
    env["CORS_ORIGINS"] = "http://localhost:3001,http://127.0.0.1:3001"
    env["API_BASE_URL"] = QA_API_URL
    env["QM_NEXT_DIST_DIR"] = ".next-qa"
    return env


def check_database(env: dict[str, str]) -> None:
    from sqlalchemy.engine import make_url

    url = make_url(env["DATABASE_URL"])
    if (url.database, url.host, url.port, url.username) != (
        QA_NAME, "127.0.0.1", 5433, QA_NAME
    ):
        raise RuntimeError("Safety check failed: target is not the isolated QA database.")

    engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 5})
    try:
        with engine.connect() as conn:
            actual_db, actual_user = conn.execute(
                text("SELECT current_database(), current_user")
            ).one()
        if (actual_db, actual_user) != (QA_NAME, QA_NAME):
            raise RuntimeError("Safety check failed: connected to the wrong database/user.")
    finally:
        engine.dispose()
    print("PASS: isolated QA database qualitymind_qa (127.0.0.1:5433).")


def compose(command: list[str]) -> None:
    subprocess.run(
        [
            "docker", "compose", "--project-name", "qualitymind-qa",
            "--env-file", str(QA_ENV), "-f", str(ROOT / "compose.qa.yaml"),
            *command,
        ],
        cwd=ROOT,
        check=True,
    )


def check_api() -> None:
    try:
        with urlopen(QA_API_URL + "/health", timeout=4) as response:
            if response.status != 200:
                raise RuntimeError(f"QA API health returned HTTP {response.status}")
    except (URLError, TimeoutError) as exc:
        raise RuntimeError("QA API is not running at http://127.0.0.1:8001/health") from exc
    print("PASS: isolated QA API responds on 127.0.0.1:8001.")


def check_frontend() -> None:
    try:
        with urlopen("http://127.0.0.1:3001/", timeout=8) as response:
            if response.status != 200:
                raise RuntimeError(f"QA frontend returned HTTP {response.status}")
    except (URLError, TimeoutError) as exc:
        raise RuntimeError("QA frontend is not running at http://127.0.0.1:3001/") from exc
    print("PASS: isolated QA frontend responds on 127.0.0.1:3001.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Isolated QualityMind AI QA environment")
    parser.add_argument(
        "action",
        choices=["db-up", "db-down", "migrate", "api", "frontend", "check"],
    )
    args = parser.parse_args()
    env = get_environment()

    if args.action == "db-up":
        compose(["up", "-d", "--wait", "db"])
        check_database(env)
    elif args.action == "db-down":
        compose(["down"])  # Intentionally no -v: keep QA data.
    elif args.action == "migrate":
        check_database(env)
        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=BACKEND, env=env, check=True,
        )
        print("PASS: migrations applied only to qualitymind_qa.")
    elif args.action == "api":
        check_database(env)
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "app.main:app",
             "--host", "127.0.0.1", "--port", "8001"],
            cwd=BACKEND, env=env, check=True,
        )
    elif args.action == "frontend":
        check_api()
        npm = shutil.which("npm.cmd") or shutil.which("npm")
        if npm is None:
            raise RuntimeError("npm is missing from PATH.")
        subprocess.run(
            [npm, "run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3001"],
            cwd=FRONTEND, env=env, check=True,
        )
    elif args.action == "check":
        check_database(env)
        check_api()
        check_frontend()


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"QA environment error: {exc}", file=sys.stderr)
        sys.exit(1)
