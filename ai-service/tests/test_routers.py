import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os

os.environ["GEMINI_API_KEY"] = "test_key"
os.environ["SERVICE_API_KEY"] = "test_service_key"

from app.main import app

client = TestClient(app)
HEADERS = {"X-Service-Key": "test_service_key"}


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@patch("app.routers.summarize.retriever")
@patch("app.routers.summarize.gemini_service")
def test_summarize(mock_gemini, mock_retriever):
    mock_retriever.retrieve.return_value = [
        {"text": "Machine learning is a subset of AI.", "metadata": {"page_number": "1"}, "score": 0.9}
    ]
    mock_gemini.generate_json.return_value = '''{
      "short": "A document about ML.",
      "detailed": "This document covers machine learning fundamentals.",
      "key_concepts": ["neural networks", "gradient descent"],
      "formulas": ["y = mx + b"]
    }'''

    res = client.post(
        "/api/v1/summarize",
        json={"document_id": "doc123", "user_id": "user456"},
        headers=HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["summary"]["short"] == "A document about ML."
    assert len(data["summary"]["key_concepts"]) == 2


@patch("app.routers.quiz.retriever")
@patch("app.routers.quiz.gemini_service")
def test_generate_quiz(mock_gemini, mock_retriever):
    mock_retriever.retrieve.return_value = [
        {"text": "Neural networks mimic the brain.", "metadata": {"page_number": "1"}, "score": 0.85}
    ]
    mock_gemini.generate_json.return_value = '''{
      "questions": [
        {
          "question_text": "What is a neural network?",
          "question_type": "mcq",
          "options": ["A) A type of algorithm", "B) A programming language", "C) A database", "D) An OS"],
          "correct_answer": "A) A type of algorithm",
          "explanation": "Neural networks are algorithms inspired by the brain."
        }
      ]
    }'''

    res = client.post(
        "/api/v1/quiz",
        json={"document_id": "doc123", "user_id": "user456"},
        headers=HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["questions"]) == 1
    assert data["questions"][0]["question_type"] == "mcq"


@patch("app.routers.chat.retrieval_service")
@patch("app.routers.chat.gemini_service")
def test_chat(mock_gemini, mock_retrieval):
    mock_retrieval.get_context_for_query.return_value = (
        "Context: Neural networks are used in AI.",
        [{"score": 0.9, "metadata": {"document_id": "doc123", "page_number": "1"}, "text": "Neural networks"}]
    )
    mock_retrieval.compute_confidence.return_value = 0.9
    mock_gemini.generate.return_value = "Neural networks are computational models inspired by biological brains."

    res = client.post(
        "/api/v1/chat",
        json={"message": "What is a neural network?", "user_id": "user456"},
        headers=HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert data["confidence"] == 0.9


def test_unauthorized_request():
    res = client.post("/api/v1/summarize", json={"document_id": "doc123", "user_id": "user456"})
    assert res.status_code == 403
