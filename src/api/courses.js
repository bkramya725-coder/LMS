import { api } from './client'
export const coursesApi = {
  listPublished: () => api.get('/courses'),
  listAll: () => api.get('/courses/all'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (payload) => api.post('/courses', payload),
  update: (id, payload) => api.put(`/courses/${id}`, payload),
  publish: (id) => api.patch(`/courses/${id}/publish`),
  archive: (id) => api.patch(`/courses/${id}/archive`),
  remove: (id) => api.delete(`/courses/${id}`),
  announce: (id, message) => api.post(`/courses/${id}/announcements`, { message }),
}
