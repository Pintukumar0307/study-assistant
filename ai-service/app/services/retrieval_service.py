from typing import List, Dict, Optional
from app.rag.retriever import retriever
from app.core.logging import logger


class RetrievalService:
    def get_context_for_query(
        self,
        query: str,
        document_id: Optional[str],
        user_id: str,
        top_k: int = 5,
    ) -> tuple[str, List[Dict]]:
        """Returns (context_string, source_chunks)."""
        if document_id:
            chunks = retriever.retrieve(query, document_id, user_id, top_k)
        else:
            chunks = retriever.retrieve_from_all(query, user_id, top_k)

        context = retriever.build_context(chunks)
        return context, chunks

    def compute_confidence(self, chunks: List[Dict]) -> float:
        """Compute confidence score from retrieval scores."""
        if not chunks:
            return 0.0
        avg_score = sum(c["score"] for c in chunks) / len(chunks)
        # Normalize to 0-1 range
        return round(min(max(avg_score, 0.0), 1.0), 3)


retrieval_service = RetrievalService()
