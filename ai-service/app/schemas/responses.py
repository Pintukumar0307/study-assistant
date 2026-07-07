from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class IngestResponse(BaseModel):
    success: bool
    document_id: str
    page_count: int
    chunk_count: int
    collection_id: str


class SummaryDetail(BaseModel):
    short: str
    detailed: str
    key_concepts: List[str]
    formulas: List[str]


class SummarizeResponse(BaseModel):
    success: bool
    document_id: str
    summary: SummaryDetail


class QuizQuestion(BaseModel):
    question_text: str
    question_type: str  # mcq, true_false, short_answer
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str


class QuizResponse(BaseModel):
    success: bool
    document_id: str
    questions: List[QuizQuestion]


class Flashcard(BaseModel):
    question: str
    answer: str
    difficulty: str = "medium"


class FlashcardResponse(BaseModel):
    success: bool
    document_id: str
    flashcards: List[Flashcard]
    count: int


class ChatSource(BaseModel):
    document_id: str
    document_title: Optional[str] = None
    page_number: Optional[int] = None
    chunk_text: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource]
    confidence: float


class DailyPlanItem(BaseModel):
    date: str
    tasks: List[str]
    completed: bool = False


class WeeklyPlanItem(BaseModel):
    week: int
    goals: List[str]
    topics: List[str]


class StudyPlanResponse(BaseModel):
    success: bool
    daily_plan: List[DailyPlanItem]
    weekly_plan: List[WeeklyPlanItem]
    total_days: int
