import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList } from 'lucide-react'
import { coursesApi } from '../../api/courses'
import { useAuth } from '../../context/AuthContext'
import { Loader, StatusPill } from '../../components/Feedback'
import KpiCard from '../../components/KpiCard'

export default function GenericDashboard() {
  const { user, can } = useAuth()
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = can('manageCourses') ? coursesApi.listAll() : coursesApi.listPublished()
    load.then(setCourses).catch((e) => setError(e.message))
  }, [can])

  if (error) return <p className="notice notice--error">{error}</p>
  if (!courses) return <Loader label="Loading…" />

  return (
    <div className="page">
      <h1>Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <p className="muted">
        {user?.role === 'PARENT'
          ? "Browse the course catalog. The API doesn't yet expose a parent-to-student link, so linked progress isn't available here."
          : "Here's the current course catalog."}
      </p>
      <div className="kpi-grid">
        <KpiCard icon={BookOpen} label="Visible courses" value={courses.length} />
        {can('grading') && <KpiCard icon={ClipboardList} label="Grading access" value="Enabled" />}
      </div>
      <section className="panel">
        <div className="panel__head"><h2>Courses</h2><Link to="/my-courses">View all</Link></div>
        <ul className="list">{courses.slice(0, 6).map((c) => <li key={c.courseId}><span>{c.title}</span><StatusPill status={c.status} /></li>)}</ul>
      </section>
    </div>
  )
}
