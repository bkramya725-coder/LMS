import { api } from './client'
export const certificatesApi = {
  byEnrollment: (enrollmentId) => api.get(`/certificates/enrollment/${enrollmentId}`),
  verify: (code) => api.get(`/certificates/verify/${code}`),
  revoke: (id) => api.patch(`/certificates/${id}/revoke`),
  generate: (enrollmentId) => api.post(`/certificates/generate/${enrollmentId}`),
}
export const notificationsApi = {
  mine: () => api.get('/notifications/my'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
}
