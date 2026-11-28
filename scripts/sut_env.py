"""Start only the local, pinned QA-128 self-test environment."""
import argparse
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys

from dotenv import dotenv_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "fda962e0b450e8b9f42dc5e5cf593c76213edd23"
PROJECT = "qualitymind-sut"
DB = "qualitymind_sut"
HOST = "127.0.0.1"
DB_PORT, API_PORT, UI_PORT = 5434, 8002, 3002
API = f"http://{HOST}:{API_PORT}"
UI = f"http://{HOST}:{UI_PORT}"
CONFIG = ROOT / ".env.sut"


def ensure_pinned_sources():
    paths = ["backend/app", "backend/migrations", "backend/alembic.ini", "backend/requirements.txt",
             "frontend/src", "frontend/public", "frontend/package.json", "frontend/package-lock.json",
             "frontend/next.config.ts", "frontend/postcss.config.mjs"]
    subprocess.run(["git", "diff", "--quiet", BASELINE, "--", *paths], cwd=ROOT, check=True)
    extra = subprocess.check_output(
        ["git", "ls-files", "--others", "--exclude-standard", "--", *paths], cwd=ROOT, text=True,
    )
    if extra:
        raise RuntimeError("Untracked files under pinned application paths")
    for folder in (ROOT, ROOT / "backend", ROOT / "frontend"):
        for path in folder.glob(".env*"):
            if path.name != CONFIG.name and not path.name.endswith(".example"):
                raise RuntimeError("Use a dedicated checkout with only .env.sut")


def assert_free(*ports):
    for port in ports:
        with socket.socket() as check:
            if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                check.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            try:
                check.bind((HOST, port))
            except OSError:
                raise RuntimeError(f"SUT port {port} is unavailable") from None


def environment():
    password = dotenv_values(CONFIG).get("SUT_POSTGRES_PASSWORD") if CONFIG.is_file() else None
    if not password or len(password) < 32:
        raise RuntimeError("Initialize .env.sut with the init command")
    url = URL.create("postgresql+psycopg", username=DB, password=password,
                     host=HOST, port=DB_PORT, database=DB)
    return os.environ | {
        "DATABASE_URL": url.render_as_string(hide_password=False), "POSTGRES_DB": DB,
        "SUT_POSTGRES_PASSWORD": password, "OPENAI_API_KEY": "", "APP_ENV": "sut",
        "API_BASE_URL": API, "CORS_ORIGINS": UI, "QM_NEXT_DIST_DIR": ".next-sut",
        "NEXT_TELEMETRY_DISABLED": "1", "PYTHONDONTWRITEBYTECODE": "1",
    }


def compose(*args, capture=False):
    if os.environ.get("DOCKER_HOST") or os.environ.get("DOCKER_CONTEXT"):
        raise RuntimeError("Unset Docker endpoint overrides before operating the SUT")
    endpoint = subprocess.check_output(
        ["docker", "context", "inspect", "--format", "{{.Endpoints.docker.Host}}"], text=True,
    ).strip()
    if not endpoint.startswith(("npipe://", "unix://")):
        raise RuntimeError("SUT requires a local Docker endpoint")
    options = ["docker", "compose", "--project-name", PROJECT, "--env-file", str(CONFIG),
               "-f", str(ROOT / "compose.sut.yaml")]
    return subprocess.run([*options, *args], cwd=ROOT, env=environment(), check=True,
                          capture_output=capture, text=True).stdout


def check_database():
    # Inspect only published ports and mounted volume, never container environment.
    container = compose("ps", "-q", "db", capture=True).strip()
    if not container:
        raise RuntimeError("SUT database container is unavailable")
    info = subprocess.check_output([
        "docker", "inspect", "--format", "{{json .NetworkSettings.Ports}}\t{{json .Mounts}}", container,
    ], text=True)
    bindings, mounts = map(json.loads, info.strip().split("\t"))
    if bindings != {"5432/tcp": [{"HostIp": HOST, "HostPort": str(DB_PORT)}]}:
        raise RuntimeError("SUT PostgreSQL must publish only to the dedicated loopback port")
    if not any(item.get("Name") == PROJECT + "_sut_pgdata"
               and item.get("Destination") == "/var/lib/postgresql/data" for item in mounts):
        raise RuntimeError("SUT PostgreSQL volume does not match")

    engine = create_engine(environment()["DATABASE_URL"], connect_args={"connect_timeout": 4})
    try:
        with engine.connect() as connection:
            identity = tuple(connection.execute(text(
                "SELECT current_database(), current_user, current_setting('server_version')"
            )).one())
        if identity[:2] != (DB, DB):
            raise RuntimeError("Unexpected PostgreSQL database or role")
        return identity[2]
    finally:
        engine.dispose()


def serve_api():
    assert_free(API_PORT)
    check_database()
    os.environ.update(environment())
    sys.path.insert(0, str(ROOT / "backend"))

    import uvicorn
    from app.main import app

    async def pinned_app(scope, receive, send):
        async def send_version(message):
            if message["type"] == "http.response.start":
                message["headers"].append((b"x-qualitymind-sut-sha", BASELINE.encode("ascii")))
            await send(message)
        await app(scope, receive, send_version)

    uvicorn.run(pinned_app, host=HOST, port=API_PORT, access_log=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["init", "preflight", "db-up", "migrate", "api", "frontend", "check", "db-stop"])
    command = parser.parse_args().command
    ensure_pinned_sources()
    if command == "init":
        with CONFIG.open("x", encoding="utf-8") as file:
            file.write("SUT_POSTGRES_PASSWORD=" + secrets.token_hex(24) + "\n")
        return
    if command == "preflight":
        assert_free(DB_PORT, API_PORT, UI_PORT)
        print("SUT loopback ports available.")
    elif command == "db-up":
        assert_free(DB_PORT)
        compose("up", "--detach", "--wait", "db")
        print("Verified SUT PostgreSQL", check_database())
    elif command == "migrate":
        check_database()
        subprocess.run([sys.executable, "-B", "-m", "alembic", "upgrade", "head"],
                       cwd=ROOT / "backend", env=environment(), check=True)
    elif command == "api":
        serve_api()
    elif command == "frontend":
        assert_free(UI_PORT)
        check_database()
        from urllib.request import ProxyHandler, build_opener
        with build_opener(ProxyHandler({})).open(API + "/health", timeout=5) as response:
            if response.headers.get("x-qualitymind-sut-sha") != BASELINE:
                raise RuntimeError("Frontend target is not the pinned SUT API")
        env = environment()
        for key in ("DATABASE_URL", "POSTGRES_DB", "SUT_POSTGRES_PASSWORD"):
            env.pop(key, None)
        subprocess.run(["node", "node_modules/next/dist/bin/next", "dev", "--webpack",
                        "--hostname", HOST, "--port", str(UI_PORT)], cwd=ROOT / "frontend",
                       env=env, check=True)
    elif command == "check":
        print("Verified PostgreSQL", check_database(), "database/role", DB, "port", DB_PORT)
        print("Pinned application", BASELINE)
    else:
        check_database()
        compose("stop", "db")


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.SubprocessError) as exc:
        print("SUT operation failed:", type(exc).__name__, file=sys.stderr)
        sys.exit(1)
