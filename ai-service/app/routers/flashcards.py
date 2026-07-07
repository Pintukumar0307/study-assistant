import json
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.requests import FlashcardRequest
from app.schemas.responses import FlashcardResponse, Flashcard
from app.services.gemini_service import gemini_service
from app.rag.retriever import retriever
from app.core.security import verify_service_key
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/flashcards", tags=["flashcards"])

FLASHCARD_SYSTEM = """You are an expert flashcard creator for spaced repetition learning.
Generate concise, clear flashcards from academic content.
Respond ONLY with valid JSON. No markdown, no backticks.

JSON structure:
{
  "flashcards": [
    {
      "question": "What is ...?",
      "answer": "...",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Guidelines:
- Questions should be specific and unambiguous
- Answers should be concise (1-3 sentences)
- Mix of definition, application, and conceptual questions
- Assign difficulty based on complexity"""


@router.post("", response_model=FlashcardResponse, dependencies=[Depends(verify_service_key)])
async def generate_flashcards(request: FlashcardRequest):
    try:
        chunks = retriever.retrieve(
            query="definitions concepts terms principles formulas facts",
            document_id=request.document_id,
            user_id=request.user_id,
            top_k=20,
        )

        if not chunks:
            raise HTTPException(status_code=404, detail="Document not found in vector store")

        context = "\n\n".join(c["text"] for c in chunks)

        prompt = f"""Create exactly {request.count} flashcards from this academic content.
Cover all major topics, definitions, and concepts.

Content:
{context}"""

        raw = gemini_service.generate_json(prompt, FLASHCARD_SYSTEM)
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)

        flashcards = [
            Flashcard(
                question=fc["question"],
                answer=fc["answer"],
                difficulty=fc.get("difficulty", "medium"),
            )
            for fc in data.get("flashcards", [])
        ]

        return FlashcardResponse(
            success=True,
            document_id=request.document_id,
            flashcards=flashcards,
            count=len(flashcards),
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in flashcards: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Flashcard generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
