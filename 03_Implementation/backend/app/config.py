from functools import lru_cache
from pydantic import AnyUrl, BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class AiProviderSettings(BaseModel):
    base_url: str = "https://api.openai.com/v1"
    model: str = "gpt-4o-mini"
    temperature: float = 0.2


class WorkerSettings(BaseModel):
    enabled: bool = True
    default_queue: str = "reporting_qa"
    pdf_queue: str = "reporting_qa_pdf"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Reporting QA Agent"
    api_prefix: str = "/api"
    database_url: AnyUrl | str = "postgresql+psycopg://postgres:postgres@postgres:5432/reporting"
    redis_url: AnyUrl | str = "redis://redis:6379/0"
    vector_store_path: str = "/data/vectorstore"
    enable_vector_store: bool = True

    ai_provider: AiProviderSettings = AiProviderSettings()
    worker: WorkerSettings = WorkerSettings()

    danger_words_path: str = "prompts/danger_words.txt"
    base_prompt_path: str = "prompts/base_prompt.md"


@lru_cache
def get_settings() -> Settings:
    return Settings()
