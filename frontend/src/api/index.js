import api from './axios'

export const quizApi = {
  generate: (documentId) => api.post('/quiz/generate', { documentId }),
  getAll: (params) => api.get('/quiz', { params }),
  getOne: (id) => api.get(`/quiz/${id}`),
  submit: (id, data) => api.post(`/quiz/${id}/submit`, data),
}

export const chatApi = {
  send: (data) => api.post('/chat', data),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (sessionId) => api.get(`/chat/sessions/${sessionId}`),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
}

export const flashcardsApi = {
  generate: (documentId) => api.post('/flashcards/generate', { documentId }),
  getAll: (documentId) => api.get(`/flashcards/${documentId}`),
  review: (documentId, cardId, quality) =>
    api.post(`/flashcards/${documentId}/review/${cardId}`, { quality }),
}

export const studyPlannerApi = {
  generate: (data) => api.post('/study-planner/generate', data),
  getPlan: (documentId) => api.get(`/study-planner/${documentId}`),
  completeTask: (documentId, date) =>
    api.put(`/study-planner/${documentId}/task`, { date }),
}

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  getDashboard: () => api.get('/users/dashboard'),
}
