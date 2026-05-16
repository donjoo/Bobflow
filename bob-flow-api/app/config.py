from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    git_repo_path: Path

    @property
    def resolved_repo_path(self) -> Path:
        return self.git_repo_path.resolve()


settings = Settings()
