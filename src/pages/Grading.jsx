import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { coursesApi } from '../api/courses'
import { assessmentsApi } from '../api/assessments'
import { submissionsApi, gradesApi } from '../api/submissions'
import { enrollmentsApi } from '../api/enrollments'
import { absoluteFileUrl } from '../api/files'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/useToast'
import { TableSkeleton, EmptyState, StatusPill } from '../components/Feedback'
import Modal from '../components/Modal'
import Field from '../components/Field'
import { initials } from '../utils/format'
import { validateGrade } from '../utils/validators'

export default function Grading() {
  const { can } = useAuth()
  const toast = useToast()
  const manage = can('manageCourses')

  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [assessments, setAssessments] = useState([])
  const [assessmentId, setAssessmentId] = useState('')
  const [submissions, setSubmissions] = useState(null)
  const [error, setError] = useState('')

  const [grading, setGrading] = useState(null)
  const [values, setValues] = useState({ score: '', feedback: '' })
  const [errors, setErrors] = useState({})

  const [finalGrades, setFinalGrades] = useState(null)
  const [publishingId, setPublishingId] = useState(null)

  useEffect(() => {
    const load = manage ? coursesApi.listAll() : coursesApi.listPublished()
    load.then((data) => { setCourses(data); if (data.length) setCourseId(String(data[0].courseId)) }).catch((e) => setError(e.message))
  }, [manage])

  useEffect(() => {
    if (!courseId) return
    setAssessmentId('')
    setSubmissions(null)
    assessmentsApi.listByCourse(courseId).then((data) => { setAssessments(data); if (data.length) setAssessmentId(String(data[0].assessmentId)) }).catch((e) => setError(e.message))
  }, [courseId])

  useEffect(() => {
    if (!assessmentId) { setSubmissions([]); return }
    setSubmissions(null)
    submissionsApi.byAssessment(assessmentId).then(setSubmissions).catch((e) => setError(e.message))
  }, [assessmentId])

  useEffect(() => {
    if (!courseId) return
    setFinalGrades(null)
    async function loadGrades() {
      try {
        const enrollments = await enrollmentsApi.byCourse(courseId)
        const results = await Promise.all(
          enrollments.map(async (e) => {
            try {
              return { enrollment: e, grade: await gradesApi.byEnrollment(e.enrollmentId) }
            } catch {
              // No submissions graded yet for this student in this course —
              // GradeService only creates a row once something has been graded.
              return { enrollment: e, grade: null }
            }
          })
        )
        setFinalGrades(results)
      } catch (e) {
        setError(e.message)
      }
    }
    loadGrades()
  }, [courseId])

  async function handlePublishGrade(gradeId) {
    setPublishingId(gradeId)
    try {
      const updated = await gradesApi.publish(gradeId)
      setFinalGrades((list) => list.map((r) => (r.grade?.gradeId === gradeId ? { ...r, grade: updated } : r)))
      toast.success('Grade published to the student')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPublishingId(null)
    }
  }

  function openGrade(sub) {
    setGrading(sub)
    setValues({ score: sub.score ?? '', feedback: sub.feedback || '' })
    setErrors({})
  }

  async function handleGrade(e) {
    e.preventDefault()
    const fieldErrors = validateGrade(values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return
    try {
      const updated = await submissionsApi.grade(grading.submissionId, { score: Number(values.score), feedback: values.feedback })
      setSubmissions((list) => list.map((s) => (s.submissionId === updated.submissionId ? updated : s)))
      setGrading(null)
      toast.success('Submission graded')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="page">
      <h1>Grading</h1>
      {error && <p className="notice notice--error">{error}</p>}

      <div className="field-row">
        <Field label="Course" name="courseId" as="select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
        </Field>
        <Field label="Assessment" name="assessmentId" as="select" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
          {assessments.map((a) => <option key={a.assessmentId} value={a.assessmentId}>{a.title}</option>)}
        </Field>
      </div>

      {!submissions ? <TableSkeleton /> : submissions.length === 0 ? <EmptyState title="No submissions for this assessment yet" /> : (
        <table className="data-table">
          <thead><tr><th>Student</th><th>Submitted</th><th>File</th><th>Status</th><th>Score</th><th /></tr></thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.submissionId}>
                <td>
                  <div className="table-person">
                    <span className="avatar">{initials(s.student?.user?.fullName)}</span>
                    {s.student?.user?.fullName || `Student #${s.student?.studentId}`}
                  </div>
                </td>
                <td>{new Date(s.submittedDate).toLocaleString()}</td>
                <td>
                  {s.fileUrl ? (
                    <a href={absoluteFileUrl(s.fileUrl)} target="_blank" rel="noreferrer" className="link-button">
                      <FileText size={13} style={{ verticalAlign: '-2px' }} /> View file
                    </a>
                  ) : (
                    <span className="muted">Quiz answers</span>
                  )}
                </td>
                <td><StatusPill status={s.status} /></td>
                <td>{s.score ?? '—'}</td>
                <td><button type="button" className="btn btn--sm btn--ghost" onClick={() => openGrade(s)}>{s.status === 'GRADED' ? 'Update grade' : 'Grade'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal title="Grade submission" open={Boolean(grading)} onClose={() => setGrading(null)}>
        <form onSubmit={handleGrade} noValidate>
          <Field label="Score" name="score" type="number" min="0" step="0.5" required error={errors.score} value={values.score} onChange={(e) => setValues((v) => ({ ...v, score: e.target.value }))} />
          <Field label="Feedback" name="feedback" as="textarea" rows={4} hint="Optional" value={values.feedback} onChange={(e) => setValues((v) => ({ ...v, feedback: e.target.value }))} />
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setGrading(null)}>Cancel</button>
            <button type="submit" className="btn btn--accent">Save grade</button>
          </div>
        </form>
      </Modal>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Final grades</h2>
            <p className="muted" style={{ margin: 0 }}>Auto-computed from every graded submission in this course. Publish to release a grade to its student.</p>
          </div>
        </div>
        {!finalGrades ? <TableSkeleton /> : finalGrades.length === 0 ? <EmptyState title="No enrollments in this course yet" /> : (
          <table className="data-table">
            <thead><tr><th>Student</th><th>Final score</th><th>Letter</th><th>Status</th><th /></tr></thead>
            <tbody>
              {finalGrades.map(({ enrollment, grade }) => (
                <tr key={enrollment.enrollmentId}>
                  <td>
                    <div className="table-person">
                      <span className="avatar">{initials(enrollment.student?.user?.fullName)}</span>
                      {enrollment.student?.user?.fullName || `Student #${enrollment.student?.studentId}`}
                    </div>
                  </td>
                  <td>{grade?.finalScorePercent != null ? `${grade.finalScorePercent}%` : '—'}</td>
                  <td>{grade?.letterGrade || '—'}</td>
                  <td>{grade ? <StatusPill status={grade.status} /> : <span className="pill pill--muted">Not graded yet</span>}</td>
                  <td>
                    {grade && grade.status !== 'PUBLISHED' && (
                      <button type="button" className="btn btn--sm btn--ghost" disabled={publishingId === grade.gradeId} onClick={() => handlePublishGrade(grade.gradeId)}>
                        {publishingId === grade.gradeId ? 'Publishing…' : 'Publish'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
