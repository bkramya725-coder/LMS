import { api } from './client'
export const modulesApi = {
  listByCourse: (courseId) => api.get(`/courses/${courseId}/modules`),
  create: (courseId, payload) => api.post(`/courses/${courseId}/modules`, payload),
  publish: (id) => api.patch(`/modules/${id}/publish`),
  remove: (id) => api.delete(`/modules/${id}`),
}
export const lessonsApi = {
  listByModule: (moduleId) => api.get(`/modules/${moduleId}/lessons`),
  create: (moduleId, payload) => api.post(`/modules/${moduleId}/lessons`, payload),
  remove: (id) => api.delete(`/lessons/${id}`),
}
