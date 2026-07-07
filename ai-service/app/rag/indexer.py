from typing import List, Dict
from app.services.pdf_service import pdf_service
from app.services.chunk_service import chunk_service
from app.services.embedding_service import embedding_service
from app.rag.vector_store import vector_store
from app.core.logging import logger


class Indexer:
    def index_document(
        self,
        file_path: str,
        document_id: str,
        user_id: str,
    ) -> Dict:
        """Full pipeline: PDF → chunks → embeddings → ChromaDB."""
        # Step 1: Extract text
        pages = pdf_service.extract_text_with_pages(file_path)
        page_count = len(pages)

        if not pages:
            raise ValueError("No text could be extracted from PDF")

        # Step 2: Chunk text
        texts, metadatas = chunk_service.chunk_pages(pages, document_id, user_id)

        if not texts:
            raise ValueError("No chunks created from PDF")

        # Step 3: Generate embeddings
        logger.info(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = embedding_service.embed(texts)

        # Step 4: Store in ChromaDB
        collection_id = vector_store.upsert_chunks(
            document_id=document_id,
            user_id=user_id,
            texts=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        return {
            "page_count": page_count,
            "chunk_count": len(texts),
            "collection_id": collection_id,
        }

    def get_all_text(self, file_path: str) -> str:
        """Get full document text for summarization."""
        pages = pdf_service.extract_text_with_pages(file_path)
        return "\n\n".join(p["text"] for p in pages)


indexer = Indexer()
