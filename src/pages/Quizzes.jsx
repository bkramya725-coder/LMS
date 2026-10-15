import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpCircle, Clock } from 'lucide-react'
import { enrollmentsApi } from '../api/enrollments'
import { assessmentsApi } from '../api/assessments'
import { submissionsApi } from '../api/submissions'
import { Loader, EmptyState, StatusPill } from '../components/Feedback'

export default function Quizzes() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const enrollments = await enrollmentsApi.mine()
        const active = enrollments.filter((e) => e.status !== 'WITHDRAWN')
        const perCourse = await Promise.all(active.map((e) => assessmentsApi.listByCourse(e.course.courseId).catch(() => [])))
        const quizzes = perCourse.flat().filter((a) => a.assessmentType === 'QUIZ' && a.published)
        const submissions = await submissionsApi.mine()
        const subByAssessment = new Map(submissions.map((s) => [s.assessment?.assessmentId, s]))
        setRows(quizzes.map((a) => ({ assessment: a, submission: subByAssessment.get(a.assessmentId) || null })))
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  if (error) return <p className="notice notice--error">{error}</p>
  if (!rows) return <Loader label="Loading quizzes…" />

  return (
    <div className="page">
      <h1>Quizzes</h1>
      {rows.length === 0 ? <EmptyState title="No quizzes published yet" /> : (
        <div className="card-grid">
          {rows.map(({ assessment, submission }) => (
            <div key={assessment.assessmentId} className="panel" style={{ margin: 0 }}>
              <span className="pill pill--neutral">{assessment.course?.title}</span>
              <h3><HelpCircle size={15} style={{ verticalAlign: '-2px' }} /> {assessment.title}</h3>
              <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={13} /> {assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes} min` : 'No time limit'} · {assessment.maxPoints ?? '—'} pts
              </p>
              {submission ? (
                <>
                  <StatusPill status={submission.status} />
                  <button type="button" className="btn btn--ghost btn--sm btn--block" style={{ marginTop: '0.6rem' }} onClick={() => navigate(`/quizzes/${assessment.assessmentId}`)}>Review</button>
                </>
              ) : (
                <button type="button" className="btn btn--accent btn--sm btn--block" onClick={() => navigate(`/quizzes/${assessment.assessmentId}`)}>Start quiz</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
