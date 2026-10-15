import { useEffect, useRef, useState } from 'react'
import { UploadCloud, CheckCircle2, FileText, X } from 'lucide-react'
import { enrollmentsApi } from '../api/enrollments'
import { assessmentsApi } from '../api/assessments'
import { submissionsApi } from '../api/submissions'
import { filesApi, absoluteFileUrl } from '../api/files'
import { useToast } from '../components/useToast'
import { Loader, EmptyState, StatusPill, Notice } from '../components/Feedback'
import { formatDate } from '../utils/format'

const TABS = ['All', 'Pending', 'Submitted', 'Graded']

export default function Assignments() {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('All')
  // Per-assessment: the file picked but not yet submitted, and upload progress.
  const [pending, setPending] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const fileInputRefs = useRef({})

  async function load() {
    try {
      const enrollments = await enrollmentsApi.mine()
      const active = enrollments.filter((e) => e.status !== 'WITHDRAWN')
      const perCourse = await Promise.all(active.map((e) => assessmentsApi.listByCourse(e.course.courseId).catch(() => [])))
      const assignments = perCourse.flat().filter((a) => a.assessmentType === 'ASSIGNMENT' && a.published)
      const submissions = await submissionsApi.mine()
      const subByAssessment = new Map(submissions.map((s) => [s.assessment?.assessmentId, s]))
      setRows(assignments.map((a) => ({ assessment: a, submission: subByAssessment.get(a.assessmentId) || null })))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  function handlePickFile(assessmentId, file) {
    if (!file) return
    setPending((v) => ({ ...v, [assessmentId]: file }))
  }

  function clearPending(assessmentId) {
    setPending((v) => { const next = { ...v }; delete next[assessmentId]; return next })
  }

  async function handleSubmit(assessmentId) {
    const file = pending[assessmentId]
    if (!file) { toast.error('Choose a file before submitting'); return }
    setSubmittingId(assessmentId)
    try {
      const uploaded = await filesApi.upload(file, (pct) => setUploadProgress((v) => ({ ...v, [assessmentId]: pct })))
      const created = await submissionsApi.submit({ assessmentId, fileUrl: uploaded.url, answers: null })
      setRows((list) => list.map((r) => (r.assessment.assessmentId === assessmentId ? { ...r, submission: created } : r)))
      clearPending(assessmentId)
      toast.success('Assignment submitted')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmittingId(null)
      setUploadProgress((v) => ({ ...v, [assessmentId]: undefined }))
    }
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!rows) return <Loader label="Loading assignments…" />

  const counts = {
    All: rows.length,
    Pending: rows.filter((r) => !r.submission).length,
    Submitted: rows.filter((r) => r.submission?.status === 'SUBMITTED').length,
    Graded: rows.filter((r) => r.submission?.status === 'GRADED').length,
  }
  const filtered = rows.filter((r) => {
    if (tab === 'All') return true
    if (tab === 'Pending') return !r.submission
    return r.submission?.status === tab.toUpperCase()
  })

  return (
    <div className="page">
      <h1>Assignments</h1>
      <p className="muted">{counts.All} assignment{counts.All === 1 ? '' : 's'} · {counts.Pending} pending · {counts.Submitted} submitted · {counts.Graded} graded</p>

      <div className="tab-row">
        {TABS.map((t) => <button key={t} type="button" className={`tab-btn${tab === t ? ' is-active' : ''}`} onClick={() => setTab(t)}>{t}{t !== 'All' ? ` (${counts[t]})` : ''}</button>)}
      </div>

      {filtered.length === 0 ? <EmptyState title="Nothing here" hint="Check back once new assignments are published." /> : (
        filtered.map(({ assessment, submission }) => {
          const file = pending[assessment.assessmentId]
          const progress = uploadProgress[assessment.assessmentId]
          const isSubmitting = submittingId === assessment.assessmentId
          return (
            <div key={assessment.assessmentId} className="panel">
              <div className="panel__head">
                <div>
                  <span className="pill pill--neutral" style={{ marginBottom: '0.3rem' }}>{assessment.course?.title}</span>
                  <h3 style={{ margin: 0 }}>{assessment.title}</h3>
                  <p className="muted" style={{ margin: 0 }}>{assessment.maxPoints ? `${assessment.maxPoints} points` : ''} {assessment.dueDate ? `· Due ${formatDate(assessment.dueDate)}` : ''}</p>
                </div>
                {submission ? <StatusPill status={submission.status} /> : <span className="pill pill--warn">Pending</span>}
              </div>

              {!submission ? (
                <div className="dropzone">
                  <input
                    ref={(el) => (fileInputRefs.current[assessment.assessmentId] = el)}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => handlePickFile(assessment.assessmentId, e.target.files?.[0])}
                  />
                  {!file ? (
                    <>
                      <UploadCloud size={20} />
                      <p style={{ margin: 0 }}>Upload your work — any file type, up to 25MB</p>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileInputRefs.current[assessment.assessmentId]?.click()}>
                        Choose file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="button-row" style={{ justifyContent: 'center' }}>
                        <FileText size={16} />
                        <span>{file.name}</span>
                        {!isSubmitting && (
                          <button type="button" className="icon-btn" style={{ padding: '0.2rem' }} onClick={() => clearPending(assessment.assessmentId)} aria-label="Remove file">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      {isSubmitting && progress != null && (
                        <div className="progress-track" style={{ width: '100%', maxWidth: 280 }}>
                          <div className="progress-track__fill" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      <button type="button" className="btn btn--accent btn--sm" disabled={isSubmitting} onClick={() => handleSubmit(assessment.assessmentId)}>
                        {isSubmitting ? `Uploading… ${progress ?? 0}%` : 'Submit assignment'}
                      </button>
                    </>
                  )}
                </div>
              ) : submission.status === 'GRADED' ? (
                <Notice tone="success">
                  <CheckCircle2 size={13} style={{ verticalAlign: '-2px' }} /> Graded — {submission.score} / {assessment.maxPoints ?? '—'} pts{submission.feedback ? `. ${submission.feedback}` : ''}
                  {submission.fileUrl && <> · <a href={absoluteFileUrl(submission.fileUrl)} target="_blank" rel="noreferrer">View your submission</a></>}
                </Notice>
              ) : (
                <Notice tone="info">
                  Submitted {formatDate(submission.submittedDate)} — awaiting review from your instructor.
                  {submission.fileUrl && <> · <a href={absoluteFileUrl(submission.fileUrl)} target="_blank" rel="noreferrer">View your submission</a></>}
                </Notice>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
