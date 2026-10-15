import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyCertificate from './pages/VerifyCertificate'
import NotFound from './pages/NotFound'

import Dashboard from './pages/Dashboard'
import MyCourses from './pages/MyCourses'
import CourseDetail from './pages/CourseDetail'
import CoursePlayer from './pages/CoursePlayer'
import Assignments from './pages/Assignments'
import Quizzes from './pages/Quizzes'
import QuizPlayer from './pages/QuizPlayer'
import Analytics from './pages/Analytics'
import Grading from './pages/Grading'
import Students from './pages/Students'
import AdminPanel from './pages/AdminPanel'
import Certificates from './pages/Certificates'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  const location = useLocation()
  return (
    <>
      <ScrollToTop />
      <Routes location={location}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-certificate" element={<VerifyCertificate />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/learn/:id" element={<ProtectedRoute need="enroll"><CoursePlayer /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute need="enroll"><Assignments /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute need="enroll"><Quizzes /></ProtectedRoute>} />
        <Route path="/quizzes/:id" element={<ProtectedRoute need="enroll"><QuizPlayer /></ProtectedRoute>} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/grading" element={<ProtectedRoute need="grading"><Grading /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute need="instructorView"><Students /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute need="adminPanel"><AdminPanel /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute need="certificates"><Certificates /></ProtectedRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
