import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { coursesApi } from '../api/courses'
import { enrollmentsApi } from '../api/enrollments'
import { useToast } from '../components/useToast'
import { TableSkeleton, EmptyState, StatusPill } from '../components/Feedback'
import { initials, formatDate } from '../utils/format'

const TABS = ['User Management', 'Course Management', 'Reports & Export']

function downloadCsv(filename, header, rows) {
  const csv = header + '\n' + rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPanel() {
  const toast = useToast()
  const [tab, setTab] = useState('User Management')
  const [courses, setCourses] = useState(null)
  const [roster, setRoster] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const allCourses = await coursesApi.listAll()
        setCourses(allCourses)
        const enrollLists = await Promise.all(allCourses.map((c) => enrollmentsApi.byCourse(c.courseId).catch(() => [])))
        const people = new Map()
        allCourses.forEach((c) => { if (c.instructor?.user) people.set(c.instructor.user.userId, { ...c.instructor.user, role: 'INSTRUCTOR', courses: 1 }) })
        enrollLists.flat().forEach((e) => {
          if (!e.student?.user) return
          const existing = people.get(e.student.user.userId)
          if (existing) existing.courses += 1
          else people.set(e.student.user.userId, { ...e.student.user, role: 'STUDENT', courses: 1 })
        })
        setRoster(Array.from(people.values()))
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const filteredRoster = useMemo(() => {
    if (!roster) return []
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter((p) => p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
  }, [roster, search])

  async function handlePublish(id) {
    try { setCourses((list) => list.map((c) => (c.courseId === id ? { ...c, status: 'PUBLISHED' } : c))); await coursesApi.publish(id); toast.success('Course published') } catch (e) { toast.error(e.message) }
  }
  async function handleArchive(id) {
    try { const updated = await coursesApi.archive(id); setCourses((list) => list.map((c) => (c.courseId === id ? updated : c))); toast.success('Course archived') } catch (e) { toast.error(e.message) }
  }
  async function handleDelete(id) {
    if (!window.confirm('Delete this course? This cannot be undone.')) return
    try { await coursesApi.remove(id); setCourses((list) => list.filter((c) => c.courseId !== id)); toast.success('Course deleted') } catch (e) { toast.error(e.message) }
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!courses || !roster) return <TableSkeleton />

  const published = courses.filter((c) => c.status === 'PUBLISHED').length

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <p className="muted">Manage users, courses, and platform settings.</p>

      <div className="tab-row">
        {TABS.map((t) => <button key={t} type="button" className={`tab-btn${tab === t ? ' is-active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'User Management' && (
        <>
          <p className="notice notice--info">
            The API doesn't expose a dedicated user-directory endpoint yet, so this roster is built from people visible through course
            ownership and enrollment records — real accounts, but a brand-new user with no course activity won't appear until they do something.
          </p>
          <div className="button-row" style={{ marginBottom: '1rem' }}>
            <div className="search-input-wrap"><Search size={15} /><input className="search-input" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
          {filteredRoster.length === 0 ? <EmptyState title="No users found" /> : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Courses</th><th>Joined</th></tr></thead>
              <tbody>
                {filteredRoster.map((p) => (
                  <tr key={p.userId}>
                    <td><div className="table-person"><span className="avatar">{initials(p.fullName)}</span>{p.fullName}</div></td>
                    <td>{p.email}</td>
                    <td><span className="pill pill--neutral">{p.role}</span></td>
                    <td><span className={`pill ${p.active ? 'pill--good' : 'pill--bad'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                    <td>{p.courses}</td>
                    <td>{formatDate(p.createdDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'Course Management' && (
        <>
          <p className="notice notice--info">Admin can edit, publish, archive, or delete any course, but only Instructors can create new ones — the API requires an instructor profile to create a course.</p>
          {courses.length === 0 ? <EmptyState title="No courses yet" /> : (
            <table className="data-table">
              <thead><tr><th>Title</th><th>Instructor</th><th>Status</th><th /></tr></thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.courseId}>
                    <td><Link to={`/courses/${c.courseId}`} className="link-button">{c.title}</Link></td>
                    <td>{c.instructor?.user?.fullName || '—'}</td>
                    <td><StatusPill status={c.status} /></td>
                    <td>
                      <div className="button-row">
                        {c.status !== 'PUBLISHED' && <button type="button" className="btn btn--sm btn--ghost" onClick={() => handlePublish(c.courseId)}>Publish</button>}
                        {c.status !== 'ARCHIVED' && <button type="button" className="btn btn--sm btn--ghost" onClick={() => handleArchive(c.courseId)}>Archive</button>}
                        <button type="button" className="btn btn--sm btn--danger" onClick={() => handleDelete(c.courseId)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'Reports & Export' && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><div className="kpi-card__value">{roster.length}</div><div className="kpi-card__label">People (from activity)</div></div>
            <div className="kpi-card"><div className="kpi-card__value">{courses.length}</div><div className="kpi-card__label">Total courses</div></div>
            <div className="kpi-card"><div className="kpi-card__value">{published}</div><div className="kpi-card__label">Published</div></div>
          </div>
          <div className="panel">
            <h2>Export</h2>
            <div className="button-row">
              <button type="button" className="btn btn--ghost" onClick={() => downloadCsv('users.csv', 'Name,Email,Role,Status,Courses,Joined', roster.map((p) => [p.fullName, p.email, p.role, p.active ? 'Active' : 'Inactive', p.courses, formatDate(p.createdDate)]))}>
                <Download size={14} /> Export users CSV
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => downloadCsv('courses.csv', 'Title,Category,Level,Status,Instructor', courses.map((c) => [c.title, c.category, c.level, c.status, c.instructor?.user?.fullName || '']))}>
                <Download size={14} /> Export courses CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
