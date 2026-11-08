
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, sessionmaker

# Charger le .env situé à la racine du projet
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

password = os.getenv("POSTGRES_PASSWORD")

if not password:
    raise RuntimeError("POSTGRES_PASSWORD is not configured")

database_url = URL.create(
    drivername="postgresql+psycopg",
    username="qualitymind",
    password=password,
    host="127.0.0.1",
    port=5432,
    database="qualitymind",
)

engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
)


def get_db():
    with SessionLocal() as db:
        yield db