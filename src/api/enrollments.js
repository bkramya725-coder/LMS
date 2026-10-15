import { api } from './client'
export const enrollmentsApi = {
  mine: () => api.get('/enrollments/my'),
  byCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),
  getById: (id) => api.get(`/enrollments/${id}`),
  enroll: (courseId) => api.post('/enrollments', { courseId }),
  updateProgress: (id, progressPercent) => api.patch(`/enrollments/${id}/progress`, { progressPercent }),
  withdraw: (id) => api.patch(`/enrollments/${id}/withdraw`),
}
