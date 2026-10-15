import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { coursesApi } from '../api/courses'
import { enrollmentsApi } from '../api/enrollments'
import { useAuth } from '../context/AuthContext'
import { TableSkeleton, EmptyState, StatusPill } from '../components/Feedback'
import { initials, timeAgo } from '../utils/format'

export default function Students() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const all = await coursesApi.listAll()
        const mine = all.filter((c) => c.instructor?.user?.userId === user.userId)
        const lists = await Promise.all(mine.map((c) => enrollmentsApi.byCourse(c.courseId).catch(() => [])))
        setRows(mine.flatMap((c, i) => lists[i].map((e) => ({ ...e, courseTitle: c.title }))))
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [user.userId])

  function handleExport() {
    const header = 'Student,Email,Course,Progress,Status,Last Active\n'
    const csv = rows.map((r) => [r.student?.user?.fullName, r.student?.user?.email, r.courseTitle, `${r.progressPercent || 0}%`, r.status, r.lastActiveDate || ''].map((v) => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([header + csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!rows) return <TableSkeleton />

  return (
    <div className="page">
      <div className="page__head">
        <div><h1>Students</h1><p className="muted">{rows.length} students enrolled across your courses</p></div>
        <button type="button" className="btn btn--ghost btn--sm" disabled={rows.length === 0} onClick={handleExport}><Download size={14} /> Export</button>
      </div>

      {rows.length === 0 ? <EmptyState title="No students yet" hint="Once learners enroll in your courses, they'll show up here." /> : (
        <table className="data-table">
          <thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Last active</th><th>Score</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.enrollmentId}>
                <td>
                  <div className="table-person">
                    <span className="avatar">{initials(r.student?.user?.fullName)}</span>
                    <div className="table-person__meta">
                      <div className="table-person__name">{r.student?.user?.fullName}</div>
                      <div className="table-person__sub">{r.student?.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td>{r.courseTitle}</td>
                <td style={{ minWidth: 120 }}>
                  <div className="progress-track" style={{ marginBottom: '0.2rem' }}><div className="progress-track__fill" style={{ width: `${r.progressPercent || 0}%` }} /></div>
                  <span className="muted">{Number(r.progressPercent || 0).toFixed(0)}%</span>
                </td>
                <td>{r.lastActiveDate ? timeAgo(r.lastActiveDate) : '—'}</td>
                <td>{r.grade?.finalScorePercent != null ? `${r.grade.finalScorePercent}%` : '—'}</td>
                <td><StatusPill status={r.status} /> {r.atRisk && <span className="pill pill--bad">At risk</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
