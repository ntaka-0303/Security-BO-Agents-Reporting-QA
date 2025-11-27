from collections.abc import Generator

from sqlalchemy.orm import Session

from .config import get_settings
from .db.session import SessionLocal


settings = get_settings()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
