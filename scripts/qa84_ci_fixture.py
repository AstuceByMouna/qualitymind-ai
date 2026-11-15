"""Seed/clean one isolated CI-only QA-84 requirement, never DEV."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import create_engine, text

from qa_env import check_database, get_environment

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    if os.getenv("GITHUB_ACTIONS") != "true":
        raise RuntimeError("QA-84 fixture tool is for isolated GitHub Actions only.")

    if len(sys.argv) != 2 or sys.argv[1] not in {"seed", "cleanup"}:
        raise SystemExit("Usage: qa84_ci_fixture.py seed|cleanup")

    env = get_environment()
    check_database(env)  # Exact QA DB name, user and port are verified.
    db = create_engine(env["DATABASE_URL"])
    try:
        if sys.argv[1] == "seed":
            requirement_id = uuid4()
            with db.begin() as conn:
                conn.execute(
                    text(
                        "INSERT INTO requirements (id, title, description) "
                        "VALUES (:id, :title, :description)"
                    ),
                    {
                        "id": requirement_id,
                        "title": "QA84 CI isolated fixture",
                        "description": "Disposable qualitymind_qa requirement for UI tests",
                    },
                )
            github_env = os.getenv("GITHUB_ENV")
            if not github_env:
                raise RuntimeError("GITHUB_ENV is missing")
            with open(github_env, "a", encoding="utf-8") as output:
                output.write(f"QA84_FIXTURE_UUID={requirement_id}" + chr(10))
            print("PASS: seeded a dedicated QA-84 requirement in qualitymind_qa")
        else:
            raw_id = os.getenv("QA84_FIXTURE_UUID")
            if not raw_id:
                print("SKIP: no fixture ID to clean.")
                return
            requirement_id = UUID(raw_id)
            with db.begin() as conn:
                conn.execute(
                    text("DELETE FROM requirements WHERE id = :id"),
                    {"id": requirement_id},
                )
            with db.connect() as conn:
                remaining = conn.scalar(
                    text("SELECT count(*) FROM requirements WHERE id = :id"),
                    {"id": requirement_id},
                )
                if remaining != 0:
                    raise RuntimeError("QA fixture cleanup did not complete")
            print("PASS: deleted only the QA-84 CI fixture and verified its absence")
    finally:
        db.dispose()


if __name__ == "__main__":
    main()
