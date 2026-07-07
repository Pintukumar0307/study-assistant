from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str
    service_api_key: str = "internal_service_key"

    # ChromaDB
    chroma_host: str = "chromadb"
    chroma_port: int = 8001
    chroma_persist_path: str = "/data/chromadb"

    # Embedding
    embedding_model: str = "all-MiniLM-L6-v2"

    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # App
    app_env: str = "development"
    log_level: str = "info"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
