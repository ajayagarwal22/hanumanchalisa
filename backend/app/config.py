"""Application configuration loaded from environment variables.

Copy ``.env.example`` to ``.env`` and fill in the values you need. Every
setting has a sensible default so the app boots even with no configuration –
features that require credentials degrade gracefully (e.g. the cover letter
generator falls back to a built-in template when no LLM key is present).
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"


class Settings(BaseSettings):
    """Runtime configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AutoApply"
    cors_origins: str = "*"

    # --- LLM (optional). Any OpenAI-compatible endpoint works. ---
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    llm_model: str = "gpt-4o-mini"

    # --- LinkedIn job search ---
    # The public "guest" job search endpoint requires no auth and returns
    # public postings. Used for discovery only.
    linkedin_guest_api: str = (
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    )
    request_timeout_seconds: float = 15.0
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )

    # --- Automated submission (optional, requires Playwright + login) ---
    # When false (default) the app NEVER drives a browser to submit on a
    # candidate's behalf. The review/approval payload is produced instead.
    enable_browser_submit: bool = False


@lru_cache
def get_settings() -> Settings:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return Settings()
