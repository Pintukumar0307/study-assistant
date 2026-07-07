from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class IngestRequest(BaseModel):
    document_id: str
    user_id: str


class SummarizeRequest(BaseModel):
    document_id: str
    user_id: str


class QuizRequest(BaseModel):
    document_id: str
    user_id: str
    num_mcq: int = Field(default=10, ge=1, le=30)
    num_true_false: int = Field(default=5, ge=0, le=20)
    num_short_answer: int = Field(default=5, ge=0, le=20)


class FlashcardRequest(BaseModel):
    document_id: str
    user_id: str
    count: int = Field(default=20, ge=10, le=50)


class ConversationMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None
    user_id: str
    conversation_history: List[ConversationMessage] = []


class StudyPlanRequest(BaseModel):
    exam_date: str
    subjects: List[str]
    document_ids: Optional[List[str]] = []
    user_id: str
