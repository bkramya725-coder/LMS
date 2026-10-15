import axios from 'axios'

export const API_BASE = 'http://localhost:8080/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function normalizeError(error) {
  const data = error.response?.data
  let message
  let fieldErrors = {}

  if (data) {
    if (typeof data === 'string') {
      message = data
    } else if (data.message && typeof data.message === 'string') {
      message = data.message
    } else if (data.error && typeof data.error === 'string') {
      message = data.error
    }

    if (data.errors) {
      if (Array.isArray(data.errors)) {
        const parts = data.errors.map((e) => (typeof e === 'string' ? e : e.defaultMessage || e.message || JSON.stringify(e))).filter(Boolean)
        if (parts.length > 0 && !message) message = parts.join('; ')
      } else if (typeof data.errors === 'object') {
        fieldErrors = { ...data.errors }
        const parts = Object.values(data.errors).filter((v) => typeof v === 'string' && v.trim())
        if (parts.length > 0 && !message) message = parts.join('; ')
      }
    } else if (Array.isArray(data)) {
      const parts = data.map((e) => (typeof e === 'string' ? e : e.defaultMessage || e.message || JSON.stringify(e))).filter(Boolean)
      if (parts.length > 0 && !message) message = parts.join('; ')
    } else if (typeof data === 'object') {
      // Map of field -> errorMessage, ignoring meta keys
      const metaKeys = new Set(['status', 'timestamp', 'path', 'message', 'error'])
      const customEntries = Object.entries(data).filter(([k, v]) => !metaKeys.has(k) && typeof v === 'string' && v.trim())
      if (customEntries.length > 0) {
        customEntries.forEach(([k, v]) => { fieldErrors[k] = v })
        if (!message) {
          message = customEntries.map(([, v]) => v).join('; ')
        }
      }
    }
  }

  const status = error.response?.status
  const fallback = status ? `Request failed with status code ${status}` : 'Something went wrong'
  const finalError = new Error(message || error.message || fallback)
  finalError.status = status
  finalError.fieldErrors = fieldErrors
  return finalError
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lms_token')
      localStorage.removeItem('lms_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(normalizeError(error))
  }
)

export const api = {
  get: (url, config) => client.get(url, config).then((r) => r.data),
  post: (url, body, config) => client.post(url, body, config).then((r) => r.data),
  put: (url, body, config) => client.put(url, body, config).then((r) => r.data),
  patch: (url, body, config) => client.patch(url, body, config).then((r) => r.data),
  delete: (url, config) => client.delete(url, config).then((r) => r.data),
}

export default client
