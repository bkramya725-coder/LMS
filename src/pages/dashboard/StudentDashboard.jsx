import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, ClipboardList, Award, Sparkles } from 'lucide-react'
import { enrollmentsApi } from '../../api/enrollments'
import { assessmentsApi } from '../../api/assessments'
import { submissionsApi } from '../../api/submissions'
import { coursesApi } from '../../api/courses'
import { useAuth } from '../../context/AuthContext'
import { Loader } from '../../components/Feedback'
import KpiCard from '../../components/KpiCard'
import { formatDate, timeAgo } from '../../utils/format'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [recommended, setRecommended] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [enr, subs, allPublished] = await Promise.all([enrollmentsApi.mine(), submissionsApi.mine(), coursesApi.listPublished()])
        if (!active) return
        setEnrollments(enr)
        setSubmissions(subs)
        const enrolledIds = new Set(enr.map((e) => e.course?.courseId))
        setRecommended(allPublished.filter((c) => !enrolledIds.has(c.courseId)).slice(0, 3))

        const activeEnr = enr.filter((e) => e.status !== 'WITHDRAWN')
        const perCourse = await Promise.all(activeEnr.map((e) => assessmentsApi.listByCourse(e.course.courseId).catch(() => [])))
        const submittedIds = new Set(subs.map((s) => s.assessment?.assessmentId))
        const due = perCourse.flat().filter((a) => a.published && a.dueDate && !submittedIds.has(a.assessmentId)).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 4)
        if (active) setUpcoming(due)
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  if (loading) return <Loader label="Loading your dashboard…" />
  if (error) return <p className="notice notice--error">{error}</p>

  const completed = enrollments.filter((e) => e.status === 'COMPLETED').length
  const pending = submissions.filter((s) => s.status === 'SUBMITTED').length
  const graded = submissions.filter((s) => s.status === 'GRADED' && s.score != null)
  const avgScore = graded.length ? Math.round(graded.reduce((sum, s) => sum + Number(s.score), 0) / graded.length) : null
  const continueLearning = enrollments.filter((e) => e.status === 'ENROLLED' || e.status === 'IN_PROGRESS')

  const activity = [
    ...submissions.map((s) => ({ date: s.submittedDate, text: `Submitted "${s.assessment?.title}"` })),
    ...graded.map((s) => ({ date: s.gradedDate || s.submittedDate, text: `Graded: "${s.assessment?.title}" — ${s.score} pts` })),
  ].filter((a) => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div className="page">
      <h1>Good to see you, {user?.fullName?.split(' ')[0]}</h1>
      <p className="muted">You have {pending} submission{pending === 1 ? '' : 's'} awaiting grading{upcoming.length ? ` and ${upcoming.length} assessment${upcoming.length === 1 ? '' : 's'} due soon` : ''}.</p>

      <div className="kpi-grid">
        <KpiCard icon={BookOpen} label="Enrolled courses" value={enrollments.length} />
        <KpiCard icon={CheckCircle2} label="Completed" value={completed} />
        <KpiCard icon={ClipboardList} label="Awaiting grade" value={pending} />
        <KpiCard icon={Award} label="Average score" value={avgScore != null ? `${avgScore}%` : '—'} />
      </div>

      <div className="dashboard-grid">
        <div>
          <section className="panel">
            <div className="panel__head"><h2>Continue learning</h2><Link to="/my-courses">View all</Link></div>
            {continueLearning.length === 0 ? <p className="muted">No courses in progress. Browse the catalog to get started.</p> : (
              <ul className="list">
                {continueLearning.slice(0, 4).map((e) => (
                  <li key={e.enrollmentId} style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong>{e.course?.title}</strong>
                      <Link to={`/learn/${e.enrollmentId}`} className="btn btn--sm btn--ghost">Continue</Link>
                    </div>
                    <div className="progress-track"><div className="progress-track__fill" style={{ width: `${e.progressPercent || 0}%` }} /></div>
                    <span className="muted">{Number(e.progressPercent || 0).toFixed(0)}% complete</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Recent activity</h2>
            {activity.length === 0 ? <p className="muted">No activity yet.</p> : (
              <ul className="list">{activity.map((a, i) => <li key={i}><span>{a.text}</span><span className="muted">{timeAgo(a.date)}</span></li>)}</ul>
            )}
          </section>
        </div>

        <div>
          <section className="panel panel--dark">
            <h2><Sparkles size={15} style={{ verticalAlign: '-2px' }} /> Explore next</h2>
            <p>Courses you haven't enrolled in yet.</p>
            {recommended.length === 0 ? <p>You're enrolled in everything published — nice work!</p> : (
              recommended.map((c) => (
                <Link key={c.courseId} to={`/courses/${c.courseId}`} className="btn btn--block" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '0.5rem', justifyContent: 'flex-start' }}>
                  {c.title}
                </Link>
              ))
            )}
          </section>

          <section className="panel">
            <h2>Upcoming deadlines</h2>
            {upcoming.length === 0 ? <p className="muted">Nothing due soon.</p> : (
              <ul className="list">{upcoming.map((a) => <li key={a.assessmentId}><span>{a.title}</span><span className="pill pill--warn">{formatDate(a.dueDate)}</span></li>)}</ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
