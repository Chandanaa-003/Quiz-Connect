from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Resolve relative SQLite URL to an absolute path anchored at the backend directory
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./"):
    rel_path = db_url.replace("sqlite:///./", "")
    backend_dir = Path(__file__).resolve().parent.parent
    abs_path = (backend_dir / rel_path).resolve()
    db_url = f"sqlite:///{abs_path}"

# SQLite specific connect args for thread safety
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
