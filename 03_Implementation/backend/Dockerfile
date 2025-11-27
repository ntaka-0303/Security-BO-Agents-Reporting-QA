FROM python:3.11-slim AS base

ENV POETRY_VIRTUALENVS_CREATE=false \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev

COPY app ./app

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
