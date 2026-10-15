import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, ClipboardList, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { coursesApi } from '../../api/courses'
import { enrollmentsApi } from '../../api/enrollments'
import { assessmentsApi } from '../../api/assessments'
import { submissionsApi } from '../../api/submissions'
import { useAuth } from '../../context/AuthContext'
import { Loader } from '../../components/Feedback'
import KpiCard from '../../components/KpiCard'
import { timeAgo } from '../../utils/format'

export default function InstructorDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myCourses, setMyCourses] = useState([])
  const [enrollmentsByCourse, setEnrollmentsByCourse] = useState({})
  const [pendingSubs, setPendingSubs] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const all = await coursesApi.listAll()
        const mine = all.filter((c) => c.instructor?.user?.userId === user.userId)
        if (!active) return
        setMyCourses(mine)

        const enrollLists = await Promise.all(mine.map((c) => enrollmentsApi.byCourse(c.courseId).catch(() => [])))
        const byCourse = {}
        mine.forEach((c, i) => (byCourse[c.courseId] = enrollLists[i]))
        if (active) setEnrollmentsByCourse(byCourse)

        const assessmentLists = await Promise.all(mine.map((c) => assessmentsApi.listByCourse(c.courseId).catch(() => [])))
        const assessments = assessmentLists.flat()
        const subLists = await Promise.all(assessments.map((a) => submissionsApi.byAssessment(a.assessmentId).catch(() => [])))
        const pending = subLists.flat().filter((s) => s.status === 'SUBMITTED')
        if (active) setPendingSubs(pending)
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user.userId])

  if (loading) return <Loader label="Loading your dashboard…" />
  if (error) return <p className="notice notice--error">{error}</p>

  const allEnrollments = Object.values(enrollmentsByCourse).flat()
  const totalStudents = allEnrollments.length
  const ratings = myCourses.map((c) => Number(c.ratingAvg)).filter((r) => !Number.isNaN(r) && r > 0)
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—'

  const monthCounts = {}
  allEnrollments.forEach((e) => {
    if (!e.enrolledDate) return
    const key = new Date(e.enrolledDate).toLocaleString(undefined, { month: 'short' })
    monthCounts[key] = (monthCounts[key] || 0) + 1
  })
  const chartData = Object.entries(monthCounts).map(([month, count]) => ({ month, count }))

  return (
    <div className="page">
      <h1>Welcome back, {user?.fullName?.split(' ')[0]}</h1>

      <div className="kpi-grid">
        <KpiCard icon={BookOpen} label="Total courses" value={myCourses.length} />
        <KpiCard icon={Users} label="Students enrolled" value={totalStudents} />
        <KpiCard icon={ClipboardList} label="Pending grading" value={pendingSubs.length} />
        <KpiCard icon={Star} label="Avg rating" value={avgRating} />
      </div>

      <div className="dashboard-grid">
        <div>
          <section className="panel">
            <div className="panel__head"><h2>Your courses</h2><Link to="/my-courses">Manage all</Link></div>
            {myCourses.length === 0 ? <p className="muted">You haven't created a course yet.</p> : (
              <ul className="list">
                {myCourses.slice(0, 5).map((c) => (
                  <li key={c.courseId}>
                    <Link to={`/courses/${c.courseId}`} className="link-button">{c.title}</Link>
                    <span className="muted">{(enrollmentsByCourse[c.courseId] || []).length} students</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {chartData.length > 0 && (
            <section className="panel">
              <h2>Student enrollment by month</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5DD" />
                  <XAxis dataKey="month" stroke="#8A8DA3" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#8A8DA3" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E7E5DD', borderRadius: 8, fontSize: 12.5 }} />
                  <Bar dataKey="count" fill="#12172B" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}
        </div>

        <div>
          <section className="panel">
            <div className="panel__head"><h2>Recent submissions</h2><Link to="/grading">Go to grading</Link></div>
            {pendingSubs.length === 0 ? <p className="muted">Nothing waiting to be graded.</p> : (
              <ul className="list">
                {pendingSubs.slice(0, 5).map((s) => (
                  <li key={s.submissionId}><span>{s.student?.user?.fullName || `Student #${s.student?.studentId}`}</span><span className="pill pill--warn">{timeAgo(s.submittedDate)}</span></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
