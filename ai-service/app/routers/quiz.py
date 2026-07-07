import json
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.requests import QuizRequest
from app.schemas.responses import QuizResponse, QuizQuestion
from app.services.gemini_service import gemini_service
from app.rag.retriever import retriever
from app.core.security import verify_service_key
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/quiz", tags=["quiz"])

QUIZ_SYSTEM = """You are an expert quiz generator for academic content. Generate quiz questions based on the provided content.
Respond ONLY with valid JSON. No markdown, no backticks.

JSON structure:
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "mcq",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "explanation": "..."
    },
    {
      "question_text": "...",
      "question_type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "..."
    },
    {
      "question_text": "...",
      "question_type": "short_answer",
      "options": null,
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}"""


@router.post("", response_model=QuizResponse, dependencies=[Depends(verify_service_key)])
async def generate_quiz(request: QuizRequest):
    try:
        chunks = retriever.retrieve(
            query="important concepts facts definitions principles",
            document_id=request.document_id,
            user_id=request.user_id,
            top_k=15,
        )

        if not chunks:
            raise HTTPException(status_code=404, detail="Document not found in vector store")

        context = "\n\n".join(c["text"] for c in chunks)

        prompt = f"""Based on this academic content, generate exactly:
- {request.num_mcq} multiple choice questions (question_type: "mcq") with 4 options each
- {request.num_true_false} true/false questions (question_type: "true_false")
- {request.num_short_answer} short answer questions (question_type: "short_answer")

Content:
{context}"""

        raw = gemini_service.generate_json(prompt, QUIZ_SYSTEM)
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)

        questions = [
            QuizQuestion(
                question_text=q["question_text"],
                question_type=q["question_type"],
                options=q.get("options"),
                correct_answer=q["correct_answer"],
                explanation=q.get("explanation", ""),
            )
            for q in data.get("questions", [])
        ]

        return QuizResponse(
            success=True,
            document_id=request.document_id,
            questions=questions,
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
