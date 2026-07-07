from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import ingest, summarize, quiz, flashcards, chat, study_plan
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Service starting up...")
    # Pre-load embedding model on startup
    try:
        from app.services.embedding_service import embedding_service
        embedding_service.embed(["warmup"])
        logger.info("Embedding model pre-loaded successfully")
    except Exception as e:
        logger.warning(f"Embedding model pre-load failed (will retry on first request): {e}")
    yield
    logger.info("AI Service shutting down...")


app = FastAPI(
    title="Study Assistant AI Service",
    description="FastAPI-based AI microservice for document understanding, RAG chat, quiz and flashcard generation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ingest.router)
app.include_router(summarize.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(chat.router)
app.include_router(study_plan.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "study-assistant-ai", "version": "1.0.0"}
