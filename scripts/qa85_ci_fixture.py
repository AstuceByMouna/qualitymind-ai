"""Create and delete disposable global-search fixtures in CI QA PostgreSQL only."""
from __future__ import annotations

import os
import re
import sys
from uuid import uuid4

from sqlalchemy import create_engine, text

from qa_env import check_database, get_environment


def main() -> None:
    if os.getenv("GITHUB_ACTIONS") != "true":
        raise RuntimeError("QA85 fixtures may only run in isolated GitHub Actions.")
    if len(sys.argv) != 2 or sys.argv[1] not in {"seed", "cleanup"}:
        raise SystemExit("Usage: qa85_ci_fixture.py seed|cleanup")
    env = get_environment()
    check_database(env)
    engine = create_engine(env["DATABASE_URL"])
    try:
        if sys.argv[1] == "seed":
            prefix = "QA85" + uuid4().hex[:16]
            rows = [
                {"id": uuid4(), "title": f"{prefix}-item-{i:02d}",
                 "description": f"Global search fixture {prefix} item {i}"}
                for i in range(8)
            ]
            rows.append({"id": uuid4(), "title": f"{prefix}-100%_special",
                         "description": "Literal LIKE symbols fixture"})
            with engine.begin() as db:
                db.execute(text(
                    "INSERT INTO requirements (id, title, description) "
                    "VALUES (:id, :title, :description)"
                ), rows)
            github_env = os.getenv("GITHUB_ENV")
            if not github_env:
                raise RuntimeError("GITHUB_ENV missing")
            with open(github_env, "a", encoding="utf-8") as output:
                output.write(f"QA85_FIXTURE_PREFIX={prefix}" + chr(10))
            print("PASS: seeded 9 QA-85 requirements in isolated QA database")
        else:
            prefix = os.getenv("QA85_FIXTURE_PREFIX")
            if not prefix:
                print("SKIP: no QA85 fixture to clean")
                return
            if not re.fullmatch(r"QA85[0-9a-f]{16}", prefix):
                raise RuntimeError("Refusing cleanup: invalid QA85 fixture prefix")
            # The prefix is generated randomly. Restrict deletion to matching titles.
            with engine.begin() as db:
                deleted = db.execute(text(
                    "DELETE FROM requirements WHERE title LIKE :pattern"
                ), {"pattern": prefix + "-%"}).rowcount
            with engine.connect() as db:
                remaining = db.scalar(text(
                    "SELECT count(*) FROM requirements WHERE title LIKE :pattern"
                ), {"pattern": prefix + "-%"})
            if deleted != 9 or remaining != 0:
                raise RuntimeError(
                    f"QA85 cleanup incomplete: deleted={deleted}, remaining={remaining}"
                )
            print("PASS: exactly 9 QA-85 fixtures deleted; no matching rows remain")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
