from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Reporting QA エージェント PoC 向け集中設定。"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Reporting QA Backend"
    api_prefix: str = "/api"
    database_url: str = Field(
        default_factory=lambda: f"sqlite:///{(Path(__file__).resolve().parent.parent / 'data' / 'reporting_qa.db').as_posix()}"
    )
    ai_base_url: str = "https://api.openai.com/v1/chat/completions"
    ai_model: str = "gpt-4o-mini"
    ai_api_key: str | None = None
    confidence_threshold_default: float = 0.7
    confidence_threshold_low: float = 0.6
    # Risk thresholds
    risk_threshold_high: int = 70
    risk_threshold_medium: int = 50


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
