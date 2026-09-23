import os
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",
    )

    PROJECT_NAME: str = "TERRAGUARD AI"
    TAGLINE: str = "Predict Risk. Warn Early. Protect Communities."
    VERSION: str = "1.0.0"
    PROBLEM_STATEMENT: str = "SIH26001 - North Eastern Region Landslide Early Warning"

    # Database
    MONGODB_URI: Optional[str] = Field(default=None)
    DATABASE_NAME: str = Field(default="terraguard_ai")

    # Security
    JWT_SECRET: str = Field(default="terraguard-disaster-resilience-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Weather APIs
    OPEN_METEO_BASE_URL: str = Field(default="https://api.open-meteo.com")
    IMD_API_URL: Optional[str] = Field(default=None)
    IMD_API_KEY: Optional[str] = Field(default=None)

    # Notifications / SMS
    SMS_PROVIDER: str = Field(default="local")
    SMS_SIMULATION_DELAY_MS: int = Field(default=400)
    TWILIO_ACCOUNT_SID: Optional[str] = Field(default=None)
    TWILIO_AUTH_TOKEN: Optional[str] = Field(default=None)
    TWILIO_PHONE_NUMBER: Optional[str] = Field(default=None)

    # Runtime Modes
    DEMO_MODE: bool = Field(default=True)


settings = Settings()
