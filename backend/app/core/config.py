from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart City Decision Backend"
    api_prefix: str = "/api"
    database_url: str = Field(
        default=f"sqlite:///{Path(__file__).resolve().parents[2] / 'smart_city.db'}"
    )
    ai_provider: str = "service"
    ai_model: str = "budget-optimizer-v1"
    prompt_version: str = "v1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
