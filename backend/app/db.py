
"""PostgreSQL database configuration."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

database_url_value = os.getenv("DATABASE_URL")

if database_url_value:
    database_url = make_url(database_url_value)

    # Use the psycopg v3 driver.
    if database_url.drivername == "postgresql":
        database_url = database_url.set(
            drivername="postgresql+psycopg"
        )
else:
    password = os.getenv("POSTGRES_PASSWORD")

    if not password:
        raise RuntimeError(
            "DATABASE_URL or POSTGRES_PASSWORD must be configured"
        )

    database_url = URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv("POSTGRES_USER", "qualitymind"),
        password=password,
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        database="qualitymind",
    )

# Allows integration tests to select their isolated database.
database_name = os.getenv("POSTGRES_DB")

if database_name:
    database_url = database_url.set(database=database_name)

engine = create_engine(database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
)


def get_db():
    with SessionLocal() as db:
        yield db
