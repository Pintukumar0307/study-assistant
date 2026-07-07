import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
from app.core.config import get_settings
from app.core.logging import logger


class VectorStore:
    _client = None

    def _get_client(self):
        if self._client is None:
            settings = get_settings()
            self._client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
            )
        return self._client

    def _collection_name(self, document_id: str, user_id: str) -> str:
        return f"doc_{user_id}_{document_id}"

    def upsert_chunks(
        self,
        document_id: str,
        user_id: str,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict],
    ) -> str:
        client = self._get_client()
        collection_name = self._collection_name(document_id, user_id)

        collection = client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

        ids = [f"{document_id}_chunk_{i}" for i in range(len(texts))]
        collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        logger.info(f"Upserted {len(texts)} chunks into collection {collection_name}")
        return collection_name

    def query(
        self,
        document_id: str,
        user_id: str,
        query_embedding: List[float],
        top_k: int = 5,
        where: Optional[Dict] = None,
    ) -> Dict:
        client = self._get_client()
        collection_name = self._collection_name(document_id, user_id)

        try:
            collection = client.get_collection(collection_name)
        except Exception:
            logger.warning(f"Collection {collection_name} not found")
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def query_all_user_docs(
        self,
        user_id: str,
        query_embedding: List[float],
        top_k: int = 5,
    ) -> List[Dict]:
        """Query across all user's documents."""
        client = self._get_client()
        collections = client.list_collections()
        user_collections = [c for c in collections if f"doc_{user_id}_" in c.name]

        all_results = []
        for col in user_collections:
            try:
                doc_id = col.name.replace(f"doc_{user_id}_", "")
                results = col.query(
                    query_embeddings=[query_embedding],
                    n_results=min(2, col.count()),
                    include=["documents", "metadatas", "distances"],
                )
                if results["documents"][0]:
                    all_results.extend([
                        {
                            "text": doc,
                            "metadata": meta,
                            "distance": dist,
                        }
                        for doc, meta, dist in zip(
                            results["documents"][0],
                            results["metadatas"][0],
                            results["distances"][0],
                        )
                    ])
            except Exception as e:
                logger.warning(f"Failed to query collection {col.name}: {e}")

        all_results.sort(key=lambda x: x["distance"])
        return all_results[:top_k]

    def delete_collection(self, document_id: str, user_id: str):
        client = self._get_client()
        collection_name = self._collection_name(document_id, user_id)
        try:
            client.delete_collection(collection_name)
            logger.info(f"Deleted collection {collection_name}")
        except Exception as e:
            logger.warning(f"Collection deletion failed: {e}")


vector_store = VectorStore()
