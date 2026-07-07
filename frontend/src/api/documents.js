import api from './axios'

export const documentsApi = {
  getAll: (params) => api.get('/documents', { params }),
  getOne: (id) => api.get(`/documents/${id}`),
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/documents/${id}`),
  summarize: (id) => api.post(`/documents/${id}/summarize`),
}
