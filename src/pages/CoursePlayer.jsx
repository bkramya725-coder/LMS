import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Play, CheckCircle2, Circle, FileText, Video, Radio, MonitorPlay, ChevronLeft } from 'lucide-react'
import { enrollmentsApi } from '../api/enrollments'
import { modulesApi, lessonsApi } from '../api/modules'
import { absoluteFileUrl } from '../api/files'
import { useToast } from '../components/useToast'
import { Loader, EmptyState } from '../components/Feedback'

const CONTENT_ICON = { VIDEO: Video, TEXT: FileText, SCORM: MonitorPlay, LIVE_SESSION: Radio, INTERACTIVE: MonitorPlay }

export default function CoursePlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [enrollment, setEnrollment] = useState(null)
  const [lessons, setLessons] = useState([])
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState('')
  const [savingProgress, setSavingProgress] = useState(false)
  const [progressInput, setProgressInput] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const enr = await enrollmentsApi.getById(id)
        if (!active) return
        setEnrollment(enr)
        setProgressInput(Number(enr.progressPercent || 0))
        const mods = await modulesApi.listByCourse(enr.course.courseId)
        const lessonLists = await Promise.all(mods.map((m) => lessonsApi.listByModule(m.moduleId).catch(() => [])))
        if (!active) return
        const flat = mods.flatMap((m, i) => lessonLists[i].map((l) => ({ ...l, moduleTitle: m.title })))
        setLessons(flat)
        setCurrent(flat[0] || null)
      } catch (e) {
        setError(e.message)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  async function handleSaveProgress(value) {
    setSavingProgress(true)
    try {
      const updated = await enrollmentsApi.updateProgress(id, value)
      setEnrollment(updated)
      toast.success(updated.status === 'COMPLETED' ? 'Course completed — your certificate has been issued!' : 'Progress saved')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingProgress(false)
    }
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!enrollment) return <Loader label="Loading course player…" />

  const progress = Number(enrollment.progressPercent || 0)
  const doneCount = Math.round((progress / 100) * lessons.length)

  return (
    <div className="page">
      <button
        type="button"
        className="link-button"
        style={{ marginBottom: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', cursor: 'pointer' }}
        onClick={() => {
          if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
            navigate(-1)
          } else {
            navigate(`/courses/${enrollment.course.courseId}`)
          }
        }}
      >
        <ChevronLeft size={16} /> Back to course details
      </button>
      <span className="eyebrow"><Link to={`/courses/${enrollment.course.courseId}`}>{enrollment.course.title}</Link></span>
      <h1>{current?.title || 'Course player'}</h1>

      <div className="player-layout">
        <div>
          <div className="player-stage">
            {current ? <span className="player-stage__play"><Play size={20} /></span> : <span>No lessons published yet</span>}
          </div>

          {current && (
            <div className="panel" style={{ marginTop: '1rem' }}>
              <span className="eyebrow">{current.moduleTitle}</span>
              <h2 style={{ marginBottom: '0.3rem' }}>{current.title}</h2>
              <p className="muted">{current.contentType} {current.durationSeconds ? `· ${Math.round(current.durationSeconds / 60)} min` : ''}</p>
              {current.contentUrl && <a href={absoluteFileUrl(current.contentUrl)} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">Open content link</a>}
            </div>
          )}

          <div className="panel">
            <h2>Your progress</h2>
            <div className="progress-track" style={{ marginBottom: '0.4rem' }}><div className="progress-track__fill" style={{ width: `${progress}%` }} /></div>
            <p className="muted">{progress.toFixed(0)}% complete · {enrollment.status.replace(/_/g, ' ')}</p>
            <input type="range" min="0" max="100" value={progressInput} onChange={(e) => setProgressInput(Number(e.target.value))} style={{ width: '100%' }} />
            <div className="button-row" style={{ marginTop: '0.6rem' }}>
              <button type="button" className="btn btn--ghost btn--sm" disabled={savingProgress} onClick={() => handleSaveProgress(progressInput)}>Save progress ({progressInput}%)</button>
              <button type="button" className="btn btn--accent btn--sm" disabled={savingProgress || progress >= 100} onClick={() => handleSaveProgress(100)}>Mark course complete</button>
            </div>
          </div>
        </div>

        <aside className="panel" style={{ margin: 0 }}>
          <h3>Course content</h3>
          {lessons.length === 0 ? <EmptyState title="No lessons yet" /> : (
            <div className="lesson-list">
              {lessons.map((l, i) => {
                const Icon = CONTENT_ICON[l.contentType] || FileText
                const done = i < doneCount
                return (
                  <button key={l.lessonId} type="button" className={`lesson-row${current?.lessonId === l.lessonId ? ' is-current' : ''}`} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setCurrent(l)}>
                    <span className="lesson-row__icon">{done ? <CheckCircle2 size={15} /> : <Circle size={15} />}</span>
                    <Icon size={13} />
                    {l.title}
                  </button>
                )
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
