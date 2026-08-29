"""Application configuration.

Values can be overridden via environment variables (e.g. CHOOSEFORME_DATABASE_URL).
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Central application settings."""

    model_config = SettingsConfigDict(
        env_prefix="CHOOSEFORME_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ChooseForMe API"
    debug: bool = True

    # SQLite database location (relative to the backend/ directory).
    database_url: str = f"sqlite:///{BASE_DIR / 'chooseforme.db'}"

    # Origins allowed to call the API in addition to the Vite dev proxy.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()