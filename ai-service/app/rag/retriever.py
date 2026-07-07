from typing import List, Dict, Optional
from app.rag.vector_store import vector_store
from app.services.embedding_service import embedding_service
from app.core.logging import logger


class Retriever:
    def retrieve(
        self,
        query: str,
        document_id: str,
        user_id: str,
        top_k: int = 5,
    ) -> List[Dict]:
        """Retrieve top-k relevant chunks for a query from a specific document."""
        query_embedding = embedding_service.embed_query(query)
        results = vector_store.query(
            document_id=document_id,
            user_id=user_id,
            query_embedding=query_embedding,
            top_k=top_k,
        )

        chunks = []
        if results["documents"] and results["documents"][0]:
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                chunks.append({
                    "text": doc,
                    "metadata": meta,
                    "score": 1 - dist,  # cosine similarity
                })

        logger.info(f"Retrieved {len(chunks)} chunks for query")
        return chunks

    def retrieve_from_all(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
    ) -> List[Dict]:
        query_embedding = embedding_service.embed_query(query)
        results = vector_store.query_all_user_docs(
            user_id=user_id,
            query_embedding=query_embedding,
            top_k=top_k,
        )
        return [
            {
                "text": r["text"],
                "metadata": r["metadata"],
                "score": 1 - r["distance"],
            }
            for r in results
        ]

    def build_context(self, chunks: List[Dict]) -> str:
        """Build context string from chunks."""
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            page = chunk["metadata"].get("page_number", "?")
            context_parts.append(f"[Source {i}, Page {page}]:\n{chunk['text']}")
        return "\n\n---\n\n".join(context_parts)


retriever = Retriever()
