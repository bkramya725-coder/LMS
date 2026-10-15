import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, TrendingUp, CheckCircle2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { coursesApi } from '../../api/courses'
import { enrollmentsApi } from '../../api/enrollments'
import { useAuth } from '../../context/AuthContext'
import { Loader, StatusPill } from '../../components/Feedback'
import KpiCard from '../../components/KpiCard'

const STATUS_COLORS = { COMPLETED: '#1F7A54', ENROLLED: '#12928F', IN_PROGRESS: '#1E5FA8', WITHDRAWN: '#A6690C' }

export default function AdminDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [roster, setRoster] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const allCourses = await coursesApi.listAll()
        if (!active) return
        setCourses(allCourses)
        const enrollLists = await Promise.all(allCourses.map((c) => enrollmentsApi.byCourse(c.courseId).catch(() => [])))
        const allEnrollments = enrollLists.flat()
        if (active) setEnrollments(allEnrollments)

        const people = new Map()
        allCourses.forEach((c) => { if (c.instructor?.user) people.set(c.instructor.user.userId, { ...c.instructor.user, role: 'INSTRUCTOR' }) })
        allEnrollments.forEach((e) => { if (e.student?.user) people.set(e.student.user.userId, { ...e.student.user, role: 'STUDENT' }) })
        if (active) setRoster(Array.from(people.values()))
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  if (loading) return <Loader label="Loading platform overview…" />
  if (error) return <p className="notice notice--error">{error}</p>

  const published = courses.filter((c) => c.status === 'PUBLISHED').length
  const completed = enrollments.filter((e) => e.status === 'COMPLETED').length
  const completionRate = enrollments.length ? Math.round((completed / enrollments.length) * 100) : 0

  const statusCounts = {}
  enrollments.forEach((e) => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1 })
  const pieData = Object.entries(statusCounts).map(([status, value]) => ({ name: status, value }))

  return (
    <div className="page">
      <h1>Admin overview</h1>
      <p className="muted">Welcome, {user?.fullName?.split(' ')[0]} — here's what's happening across the platform.</p>

      <div className="kpi-grid">
        <KpiCard icon={Users} label="People (from activity)" value={roster.length} />
        <KpiCard icon={BookOpen} label="Published courses" value={published} />
        <KpiCard icon={TrendingUp} label="Total enrollments" value={enrollments.length} />
        <KpiCard icon={CheckCircle2} label="Completion rate" value={`${completionRate}%`} />
      </div>

      <div className="dashboard-grid">
        <div>
          <section className="panel">
            <div className="panel__head"><h2>All courses</h2><Link to="/admin">Manage in Admin Panel</Link></div>
            {courses.length === 0 ? <p className="muted">No courses yet.</p> : (
              <ul className="list">{courses.slice(0, 6).map((c) => <li key={c.courseId}><span>{c.title}</span><StatusPill status={c.status} /></li>)}</ul>
            )}
          </section>
        </div>
        <div>
          <section className="panel">
            <h2>Enrollment status breakdown</h2>
            {pieData.length === 0 ? <p className="muted">No enrollments yet.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8A8DA3'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E7E5DD', borderRadius: 8, fontSize: 12.5 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
