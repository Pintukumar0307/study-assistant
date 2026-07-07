import json
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.requests import SummarizeRequest
from app.schemas.responses import SummarizeResponse, SummaryDetail
from app.services.gemini_service import gemini_service
from app.rag.retriever import retriever
from app.core.security import verify_service_key
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/summarize", tags=["summarize"])

SUMMARIZE_SYSTEM = """You are an expert academic summarizer. Given document content, produce:
1. A short summary (2-3 sentences)
2. A detailed summary (1-2 paragraphs)
3. Key concepts (list of important terms/ideas)
4. Important formulas or equations (empty list if none)

Respond ONLY with valid JSON matching this exact structure:
{
  "short": "...",
  "detailed": "...",
  "key_concepts": ["...", "..."],
  "formulas": ["...", "..."]
}"""


@router.post("", response_model=SummarizeResponse, dependencies=[Depends(verify_service_key)])
async def summarize_document(request: SummarizeRequest):
    try:
        # Retrieve top chunks to represent the document
        chunks = retriever.retrieve(
            query="main topics concepts summary overview",
            document_id=request.document_id,
            user_id=request.user_id,
            top_k=10,
        )

        if not chunks:
            raise HTTPException(status_code=404, detail="Document not found in vector store")

        context = "\n\n".join(c["text"] for c in chunks)
        prompt = f"Summarize this academic document content:\n\n{context}"

        raw = gemini_service.generate_json(prompt, SUMMARIZE_SYSTEM)

        # Strip any accidental markdown fences
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)

        summary = SummaryDetail(
            short=data.get("short", ""),
            detailed=data.get("detailed", ""),
            key_concepts=data.get("key_concepts", []),
            formulas=data.get("formulas", []),
        )

        return SummarizeResponse(
            success=True,
            document_id=request.document_id,
            summary=summary,
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in summarize: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
