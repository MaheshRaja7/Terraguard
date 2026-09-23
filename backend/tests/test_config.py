import os
from pathlib import Path

from backend.app.config import Settings


def test_settings_loads_terraguard_env_from_project_root(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("MONGODB_URI", raising=False)
    monkeypatch.delenv("DATABASE_NAME", raising=False)

    settings = Settings()

    assert settings.MONGODB_URI.startswith("mongodb+srv://")
    assert "cluster0" in settings.MONGODB_URI
    assert settings.DATABASE_NAME == "terraguard_ai"
