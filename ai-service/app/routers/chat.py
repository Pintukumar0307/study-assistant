from fastapi import APIRouter, Depends, HTTPException
from app.schemas.requests import ChatRequest
from app.schemas.responses import ChatResponse, ChatSource
from app.services.gemini_service import gemini_service
from app.services.retrieval_service import retrieval_service
from app.core.security import verify_service_key
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

CHAT_SYSTEM = """You are an expert AI study assistant. Answer questions based strictly on the provided context from study documents.

Rules:
- Base your answer on the provided context
- If the context doesn't contain enough information, say so clearly
- Be concise but thorough
- Use bullet points or numbered lists when helpful
- Cite which source/page the information comes from"""


@router.post("", response_model=ChatResponse, dependencies=[Depends(verify_service_key)])
async def chat(request: ChatRequest):
    try:
        # Retrieve relevant context
        context, chunks = retrieval_service.get_context_for_query(
            query=request.message,
            document_id=request.document_id,
            user_id=request.user_id,
            top_k=5,
        )

        # Build conversation history string
        history_str = ""
        if request.conversation_history:
            history_parts = []
            for msg in request.conversation_history[-6:]:  # last 6 messages
                role = "User" if msg.role == "user" else "Assistant"
                history_parts.append(f"{role}: {msg.content}")
            history_str = "\n".join(history_parts)

        prompt = f"""{"Conversation history:" + chr(10) + history_str + chr(10) + chr(10) if history_str else ""}Context from study documents:
{context}

Current question: {request.message}

Answer the question based on the context above."""

        answer = gemini_service.generate(prompt, CHAT_SYSTEM)

        # Build sources list
        sources = []
        seen = set()
        for chunk in chunks:
            meta = chunk["metadata"]
            doc_id = meta.get("document_id", "")
            page = meta.get("page_number", "?")
            key = f"{doc_id}_{page}"
            if key not in seen:
                seen.add(key)
                sources.append(ChatSource(
                    document_id=doc_id,
                    page_number=int(page) if str(page).isdigit() else None,
                    chunk_text=chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    score=round(chunk["score"], 3),
                ))

        confidence = retrieval_service.compute_confidence(chunks)

        return ChatResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
