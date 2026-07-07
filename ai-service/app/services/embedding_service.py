from sentence_transformers import SentenceTransformer
from typing import List
from app.core.config import get_settings
from app.core.logging import logger


class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._model = None
        return cls._instance

    def _load_model(self):
        if self._model is None:
            settings = get_settings()
            logger.info(f"Loading embedding model: {settings.embedding_model}")
            self._model = SentenceTransformer(settings.embedding_model)
            logger.info("Embedding model loaded")

    def embed(self, texts: List[str]) -> List[List[float]]:
        self._load_model()
        embeddings = self._model.encode(texts, show_progress_bar=False, batch_size=32)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        return self.embed([query])[0]


embedding_service = EmbeddingService()
