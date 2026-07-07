from typing import List, Dict
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import get_settings
from app.core.logging import logger


class ChunkService:
    def __init__(self):
        settings = get_settings()
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        )

    def chunk_pages(
        self,
        pages: List[Dict],
        document_id: str,
        user_id: str,
    ) -> tuple[List[str], List[Dict]]:
        """Returns (texts, metadatas) for embedding."""
        texts = []
        metadatas = []

        for page in pages:
            chunks = self.splitter.split_text(page["text"])
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                metadatas.append({
                    "document_id": document_id,
                    "user_id": user_id,
                    "page_number": str(page["page_number"]),
                    "chunk_index": str(i),
                })

        logger.info(f"Created {len(texts)} chunks from {len(pages)} pages")
        return texts, metadatas


chunk_service = ChunkService()
