import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Award, Target, BookOpen, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { enrollmentsApi } from '../api/enrollments'
import { submissionsApi } from '../api/submissions'
import { coursesApi } from '../api/courses'
import { Loader } from '../components/Feedback'
import KpiCard from '../components/KpiCard'

const STATUS_COLORS = { COMPLETED: '#1F7A54', ENROLLED: '#12928F', IN_PROGRESS: '#1E5FA8', WITHDRAWN: '#A6690C' }
const TOOLTIP_STYLE = { background: '#FFFFFF', border: '1px solid #E7E5DD', borderRadius: 8, fontSize: 12.5, fontFamily: 'IBM Plex Sans' }

function StudentAnalytics() {
  const [enrollments, setEnrollments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([enrollmentsApi.mine(), submissionsApi.mine()])
      .then(([e, s]) => { setEnrollments(e); setSubmissions(s) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Crunching your numbers…" />
  if (error) return <p className="notice notice--error">{error}</p>

  const graded = submissions.filter((s) => s.status === 'GRADED' && s.score != null && s.gradedDate).sort((a, b) => new Date(a.gradedDate) - new Date(b.gradedDate))
  const scoreTrend = graded.map((s, i) => ({ name: `#${i + 1}`, score: Number(s.score) }))
  const avgScore = graded.length ? Math.round(graded.reduce((sum, s) => sum + Number(s.score), 0) / graded.length) : null
  const completed = enrollments.filter((e) => e.status === 'COMPLETED').length

  const statusCounts = {}
  enrollments.forEach((e) => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1 })
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon={Target} label="Average score" value={avgScore != null ? `${avgScore}%` : '—'} />
        <KpiCard icon={BookOpen} label="Courses completed" value={completed} />
        <KpiCard icon={Award} label="Graded submissions" value={graded.length} />
        <KpiCard icon={TrendingUp} label="Enrollments" value={enrollments.length} />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Score trend</h2>
          {scoreTrend.length < 2 ? <p className="muted">Grade a few more assessments to see a trend line here.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5DD" />
                <XAxis dataKey="name" stroke="#8A8DA3" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#8A8DA3" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="score" stroke="#C9962F" strokeWidth={2} dot={{ r: 3, fill: '#C9962F' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
        <section className="panel">
          <h2>Enrollment breakdown</h2>
          {pieData.length === 0 ? <p className="muted">Enroll in a course to see this chart.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8A8DA3'} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </>
  )
}

function InstructorAnalytics({ userId }) {
  const [courses, setCourses] = useState([])
  const [enrollmentsByCourse, setEnrollmentsByCourse] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const all = await coursesApi.listAll()
        const mine = all.filter((c) => c.instructor?.user?.userId === userId)
        setCourses(mine)
        const lists = await Promise.all(mine.map((c) => enrollmentsApi.byCourse(c.courseId).catch(() => [])))
        const map = {}
        mine.forEach((c, i) => (map[c.title] = lists[i]))
        setEnrollmentsByCourse(map)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) return <Loader label="Crunching course performance…" />
  if (error) return <p className="notice notice--error">{error}</p>

  const chartData = Object.entries(enrollmentsByCourse).map(([title, list]) => {
    const completed = list.filter((e) => e.status === 'COMPLETED').length
    return { title: title.length > 18 ? `${title.slice(0, 18)}…` : title, completionRate: list.length ? Math.round((completed / list.length) * 100) : 0 }
  })

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon={BookOpen} label="Courses" value={courses.length} />
        <KpiCard icon={TrendingUp} label="Total students" value={Object.values(enrollmentsByCourse).flat().length} />
      </div>
      <section className="panel">
        <h2>Completion rate by course</h2>
        {chartData.length === 0 ? <p className="muted">Create a course to see performance data here.</p> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5DD" />
              <XAxis dataKey="title" stroke="#8A8DA3" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#8A8DA3" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="completionRate" fill="#12172B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </>
  )
}

export default function Analytics() {
  const { user, can } = useAuth()

  if (!can('enroll') && !can('instructorView')) {
    return (
      <div className="page">
        <h1>Analytics &amp; Insights</h1>
        <p className="notice notice--info">
          Analytics here are built from a student's own submissions or an instructor's own courses. Your role ({user.role.replace(/_/g, ' ')}) doesn't have
          either, so there's nothing role-specific to show yet — check the Admin Panel's Reports tab instead if you have access.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Analytics &amp; Insights</h1>
      <p className="muted">Track real performance trends from your account's activity.</p>
      {user.role === 'INSTRUCTOR' ? <InstructorAnalytics userId={user.userId} /> : <StudentAnalytics />}
    </div>
  )
}
