import { api } from './client'
export const assessmentsApi = {
  listByCourse: (courseId) => api.get(`/assessments/course/${courseId}`),
  getById: (id) => api.get(`/assessments/${id}`),
  create: (payload) => api.post('/assessments', payload),
  publish: (id) => api.patch(`/assessments/${id}/publish`),
  remove: (id) => api.delete(`/assessments/${id}`),
}
export const questionsApi = {
  listByCourse: (courseId) => api.get(`/questions/course/${courseId}`),
  create: (payload) => api.post('/questions', payload),
  remove: (id) => api.delete(`/questions/${id}`),
}
