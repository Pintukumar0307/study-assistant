# 📚 StudyAI — AI Study Assistant

A production-ready, full-stack AI study assistant powered by **Google Gemini**, **RAG (Retrieval-Augmented Generation)**, and **spaced repetition**.

## Architecture

```
React Frontend (Port 3000)
        │
        ▼  (Nginx reverse proxy)
Node.js API Gateway (Port 5000)
        │
   ┌────┴────┐
   │         │
MongoDB   FastAPI AI Service (Port 8000)
              │
         ┌────┴────┐
         │         │
      ChromaDB   Gemini API
```

## Features

| Feature | Description |
|---|---|
| 📄 PDF Ingestion | Upload PDFs → chunked → embedded → stored in ChromaDB |
| 🤖 AI Chat (RAG) | Ask questions grounded in your documents with source citations |
| 📝 Quiz Generation | Auto-generate 10 MCQ + 5 T/F + 5 Short Answer questions |
| 🃏 Flashcards | 20+ flashcards with SM-2 spaced repetition algorithm |
| 📊 Summarization | Short, detailed summaries + key concepts + formulas |
| 📅 Study Planner | AI-generated daily/weekly study schedule until exam |
| 📈 Dashboard | Progress charts, quiz scores, study streak |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Google Gemini API key

### 1. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit: set JWT_SECRET, JWT_REFRESH_SECRET

# AI Service  
cp ai-service/.env.example ai-service/.env
# Edit: set GEMINI_API_KEY
```

### 2. Run Everything

```bash
docker compose up --build
```

Then open **http://localhost:3000**

---

## Project Structure

```
study-assistant/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Node.js + Express + MongoDB
├── ai-service/        # FastAPI + LangChain + ChromaDB
├── docker-compose.yml
└── README.md
```

## API Reference

### Node.js Backend (`/api/v1/`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh tokens |
| GET | `/documents` | List documents |
| POST | `/documents/upload` | Upload PDF |
| POST | `/documents/:id/summarize` | Get summary |
| POST | `/quiz/generate` | Generate quiz |
| POST | `/quiz/:id/submit` | Submit answers |
| POST | `/chat` | Send RAG chat message |
| POST | `/flashcards/generate` | Generate flashcards |
| POST | `/study-planner/generate` | Generate study plan |

### FastAPI AI Service (`/api/v1/`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ingest` | Ingest PDF into ChromaDB |
| POST | `/summarize` | Summarize document |
| POST | `/quiz` | Generate quiz questions |
| POST | `/flashcards` | Generate flashcards |
| POST | `/chat` | RAG chat |
| POST | `/study-plan` | Generate study plan |

## Testing

```bash
# Backend
cd backend && npm test

# AI Service
cd ai-service && pytest tests/ -v

# Frontend
cd frontend && npm test
```

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `AI_SERVICE_URL` | FastAPI service URL |
| `AI_SERVICE_API_KEY` | Shared key between services |

### AI Service `.env`
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `SERVICE_API_KEY` | Must match backend's `AI_SERVICE_API_KEY` |
| `CHROMA_HOST` | ChromaDB hostname |
| `EMBEDDING_MODEL` | Sentence transformer model name |
