import { api } from './client'
export const submissionsApi = {
  mine: () => api.get('/submissions/my'),
  byAssessment: (assessmentId) => api.get(`/submissions/assessment/${assessmentId}`),
  getById: (id) => api.get(`/submissions/${id}`),
  submit: (payload) => api.post('/submissions', payload),
  grade: (id, payload) => api.patch(`/submissions/${id}/grade`, payload),
}
export const gradesApi = {
  byEnrollment: (enrollmentId) => api.get(`/grades/enrollment/${enrollmentId}`),
  publish: (id) => api.patch(`/grades/${id}/publish`),
}
