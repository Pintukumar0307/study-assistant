const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
const API_KEY = process.env.AI_SERVICE_API_KEY || '';


console.log(`AI Service URL: ${AI_SERVICE_URL}`);

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    'X-Service-Key': API_KEY,
  },
  timeout: 120000, // 2 minutes for AI operations
});

aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message;
    logger.error(`AI Service error: ${msg}`);
    throw new Error(msg || 'AI service unavailable');
  }
);

const ingestDocument = async (documentId, filePath, userId) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('document_id', documentId);
  formData.append('user_id', userId);

  const response = await aiClient.post('/api/v1/ingest', formData, {
    headers: { ...formData.getHeaders() },
  });
  return response.data;
};

const deleteDocument = async (documentId, userId) => {
  const response = await aiClient.delete(`/api/v1/ingest/${documentId}`, {
    params: { user_id: userId },
  });
  return response.data;
};

const summarizeDocument = async (documentId, userId) => {
  const response = await aiClient.post('/api/v1/summarize', {
    document_id: documentId,
    user_id: userId,
  });
  return response.data.summary;
};

const generateQuiz = async (documentId, userId) => {
  const response = await aiClient.post('/api/v1/quiz', {
    document_id: documentId,
    user_id: userId,
  });
  return response.data;
};

const generateFlashcards = async (documentId, userId) => {
  const response = await aiClient.post('/api/v1/flashcards', {
    document_id: documentId,
    user_id: userId,
  });
  return response.data;
};

const chat = async (message, documentId, userId, conversationHistory = []) => {
  const response = await aiClient.post('/api/v1/chat', {
    message,
    document_id: documentId,
    user_id: userId,
    conversation_history: conversationHistory,
  });
  return response.data;
};

const generateStudyPlan = async ({ examDate, subjects, documentIds }, userId) => {
  const response = await aiClient.post('/api/v1/study-plan', {
    exam_date: examDate,
    subjects,
    document_ids: documentIds,
    user_id: userId,
  });
  return response.data;
};

module.exports = {
  ingestDocument,
  deleteDocument,
  summarizeDocument,
  generateQuiz,
  generateFlashcards,
  chat,
  generateStudyPlan,
};
