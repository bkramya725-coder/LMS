import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

const PERMISSIONS = {
  ADMIN: ['manageCourses', 'adminPanel', 'grading', 'certificates'],
  DEPARTMENT_HEAD: ['manageCourses', 'grading', 'certificates'],
  INSTRUCTOR: ['manageCourses', 'createCourse', 'grading', 'certificates', 'instructorView'],
  TUTOR: ['grading'],
  STUDENT: ['learn', 'enroll', 'submit', 'certificates'],
  PARENT: ['browse'],
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem('lms_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'lms_user') setUser(readStoredUser())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = (authResponse) => {
    const nextUser = {
      userId: authResponse.userId,
      fullName: authResponse.fullName,
      email: authResponse.email,
      role: authResponse.role,
    }
    localStorage.setItem('lms_token', authResponse.token)
    localStorage.setItem('lms_user', JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const res = await authApi.login(credentials)
      return persist(res)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const res = await authApi.register(payload)
      return persist(res)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lms_token')
    localStorage.removeItem('lms_user')
    setUser(null)
  }, [])

  const can = useCallback((need) => (user ? (PERMISSIONS[user.role] || []).includes(need) : false), [user])

  return <AuthContext.Provider value={{ user, loading, login, register, logout, can }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
