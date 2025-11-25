from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session

from app.db.session import get_session


def get_db() -> Iterator[Session]:
    with get_session() as session:
        yield session
