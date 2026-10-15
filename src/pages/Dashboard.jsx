import { useAuth } from '../context/AuthContext'
import StudentDashboard from './dashboard/StudentDashboard'
import InstructorDashboard from './dashboard/InstructorDashboard'
import AdminDashboard from './dashboard/AdminDashboard'
import GenericDashboard from './dashboard/GenericDashboard'

export default function Dashboard() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') return <StudentDashboard />
  if (user?.role === 'INSTRUCTOR') return <InstructorDashboard />
  if (user?.role === 'ADMIN') return <AdminDashboard />
  return <GenericDashboard />
}
