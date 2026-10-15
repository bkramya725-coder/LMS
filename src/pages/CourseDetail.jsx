import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { coursesApi } from '../api/courses'
import { modulesApi, lessonsApi } from '../api/modules'
import { assessmentsApi, questionsApi } from '../api/assessments'
import { enrollmentsApi } from '../api/enrollments'
import { filesApi, absoluteFileUrl } from '../api/files'
import { Megaphone, UploadCloud, ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/useToast'
import { Loader, StatusPill, EmptyState } from '../components/Feedback'
import Modal from '../components/Modal'
import Field from '../components/Field'
import CourseForm from './CourseForm'
import { validateAssessment, validateQuestion } from '../utils/validators'

const CONTENT_TYPES = ['VIDEO', 'TEXT', 'SCORM', 'LIVE_SESSION', 'INTERACTIVE']
const ASSESSMENT_TYPES = ['QUIZ', 'ASSIGNMENT']
const QUESTION_TYPES = ['MCQ', 'SHORT_ANSWER', 'CODING', 'ESSAY', 'FILE_UPLOAD']

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessonsByModule, setLessonsByModule] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [error, setError] = useState('')

  const [showEdit, setShowEdit] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [lessonModal, setLessonModal] = useState(null)
  const [lessonForm, setLessonForm] = useState({ title: '', contentType: 'VIDEO', contentUrl: '', durationSeconds: '' })
  const [lessonFile, setLessonFile] = useState(null)
  const [uploadingLessonFile, setUploadingLessonFile] = useState(false)

  const [showAnnounce, setShowAnnounce] = useState(false)
  const [announceMessage, setAnnounceMessage] = useState('')
  const [sendingAnnounce, setSendingAnnounce] = useState(false)

  const [questions, setQuestions] = useState([])
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [aValues, setAValues] = useState({ title: '', assessmentType: 'QUIZ', timeLimitMinutes: '', maxPoints: '', weightPercent: '', dueDate: '', allowLateSubmission: false })
  const [aErrors, setAErrors] = useState({})
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [qValues, setQValues] = useState({ questionType: 'MCQ', questionText: '', options: '', correctAnswer: '', points: 1, difficultyLevel: 'MEDIUM' })
  const [qErrors, setQErrors] = useState({})

  const manage = can('manageCourses')

  async function loadAll() {
    try {
      const [c, mods, assess] = await Promise.all([coursesApi.getById(id), modulesApi.listByCourse(id), assessmentsApi.listByCourse(id)])
      setCourse(c)
      setModules(mods)
      setAssessments(assess)
      if (can('manageCourses') || can('enroll')) {
        questionsApi.listByCourse(id).then(setQuestions).catch(() => {})
      }
      if (can('enroll')) {
        const mine = await enrollmentsApi.mine().catch(() => [])
        setEnrollment(mine.find((e) => e.course?.courseId === Number(id)) || null)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function toggleModule(moduleId) {
    if (expanded === moduleId) { setExpanded(null); return }
    setExpanded(moduleId)
    if (!lessonsByModule[moduleId]) {
      try {
        const lessons = await lessonsApi.listByModule(moduleId)
        setLessonsByModule((m) => ({ ...m, [moduleId]: lessons }))
      } catch (e) {
        toast.error(e.message)
      }
    }
  }

  async function handleUpdateCourse(payload) {
    const updated = await coursesApi.update(id, payload)
    setCourse(updated)
    setShowEdit(false)
    toast.success('Course updated')
  }
  async function handlePublishCourse() {
    try { setCourse(await coursesApi.publish(id)); toast.success('Course published') } catch (e) { toast.error(e.message) }
  }
  async function handleArchiveCourse() {
    try { setCourse(await coursesApi.archive(id)); toast.success('Course archived') } catch (e) { toast.error(e.message) }
  }
  async function handleDeleteCourse() {
    if (!window.confirm('Delete this course? This cannot be undone.')) return
    try { await coursesApi.remove(id); toast.success('Course deleted'); navigate('/my-courses') } catch (e) { toast.error(e.message) }
  }

  async function handleCreateModule(e) {
    e.preventDefault()
    if (!moduleTitle.trim()) return
    try {
      const created = await modulesApi.create(id, { title: moduleTitle.trim(), sequenceOrder: modules.length + 1 })
      setModules((m) => [...m, created])
      setModuleTitle('')
      setShowModuleForm(false)
      toast.success('Module added')
    } catch (e) { toast.error(e.message) }
  }
  async function handlePublishModule(moduleId) {
    try {
      const updated = await modulesApi.publish(moduleId)
      setModules((list) => list.map((m) => (m.moduleId === moduleId ? updated : m)))
      toast.success('Module published')
    } catch (e) { toast.error(e.message) }
  }
  async function handleDeleteModule(moduleId) {
    if (!window.confirm('Delete this module and its lessons?')) return
    try {
      await modulesApi.remove(moduleId)
      setModules((list) => list.filter((m) => m.moduleId !== moduleId))
      toast.success('Module deleted')
    } catch (e) { toast.error(e.message) }
  }

  async function handleCreateLesson(e) {
    e.preventDefault()
    if (!lessonForm.title.trim()) return
    try {
      let contentUrl = lessonForm.contentUrl
      if (lessonFile) {
        setUploadingLessonFile(true)
        const uploaded = await filesApi.upload(lessonFile)
        contentUrl = uploaded.url
      }
      const payload = { ...lessonForm, contentUrl, durationSeconds: lessonForm.durationSeconds ? Number(lessonForm.durationSeconds) : null }
      const created = await lessonsApi.create(lessonModal, payload)
      setLessonsByModule((m) => ({ ...m, [lessonModal]: [...(m[lessonModal] || []), created] }))
      setLessonForm({ title: '', contentType: 'VIDEO', contentUrl: '', durationSeconds: '' })
      setLessonFile(null)
      setLessonModal(null)
      toast.success('Lesson added')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploadingLessonFile(false)
    }
  }
  async function handleDeleteLesson(moduleId, lessonId) {
    if (!window.confirm('Delete this lesson?')) return
    try {
      await lessonsApi.remove(lessonId)
      setLessonsByModule((m) => ({ ...m, [moduleId]: m[moduleId].filter((l) => l.lessonId !== lessonId) }))
      toast.success('Lesson deleted')
    } catch (e) { toast.error(e.message) }
  }

  async function handleSendAnnouncement(e) {
    e.preventDefault()
    if (!announceMessage.trim()) return
    setSendingAnnounce(true)
    try {
      const res = await coursesApi.announce(id, announceMessage.trim())
      toast.success(`Sent to ${res.notifiedCount} enrolled student${res.notifiedCount === 1 ? '' : 's'}`)
      setAnnounceMessage('')
      setShowAnnounce(false)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSendingAnnounce(false)
    }
  }

  async function handleEnroll() {
    try {
      const created = await enrollmentsApi.enroll(Number(id))
      setEnrollment(created)
      toast.success('Enrolled — welcome to the course!')
    } catch (e) { toast.error(e.message) }
  }

  function handleAssessmentChange(e) {
    const { name, value, type, checked } = e.target
    setAValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
  }
  async function handleCreateAssessment(e) {
    e.preventDefault()
    const errors = validateAssessment(aValues)
    setAErrors(errors)
    if (Object.keys(errors).length) return
    try {
      const created = await assessmentsApi.create({
        courseId: Number(id),
        title: aValues.title,
        assessmentType: aValues.assessmentType,
        timeLimitMinutes: aValues.timeLimitMinutes ? Number(aValues.timeLimitMinutes) : null,
        maxPoints: aValues.maxPoints ? Number(aValues.maxPoints) : null,
        weightPercent: aValues.weightPercent ? Number(aValues.weightPercent) : null,
        dueDate: aValues.dueDate ? new Date(aValues.dueDate).toISOString() : null,
        allowLateSubmission: aValues.allowLateSubmission,
      })
      setAssessments((list) => [...list, created])
      setShowAssessmentForm(false)
      setAValues({ title: '', assessmentType: 'QUIZ', timeLimitMinutes: '', maxPoints: '', weightPercent: '', dueDate: '', allowLateSubmission: false })
      toast.success('Assessment created as a draft')
    } catch (err) { toast.error(err.message) }
  }
  async function handlePublishAssessment(assessmentId) {
    try {
      const updated = await assessmentsApi.publish(assessmentId)
      setAssessments((list) => list.map((a) => (a.assessmentId === assessmentId ? updated : a)))
      toast.success('Assessment published')
    } catch (e) { toast.error(e.message) }
  }
  async function handleDeleteAssessment(assessmentId) {
    if (!window.confirm('Delete this assessment?')) return
    try {
      await assessmentsApi.remove(assessmentId)
      setAssessments((list) => list.filter((a) => a.assessmentId !== assessmentId))
      toast.success('Assessment deleted')
    } catch (e) { toast.error(e.message) }
  }

  function handleQuestionChange(e) {
    const { name, value } = e.target
    setQValues((v) => ({ ...v, [name]: value }))
  }
  async function handleCreateQuestion(e) {
    e.preventDefault()
    const errors = validateQuestion(qValues)
    setQErrors(errors)
    if (Object.keys(errors).length) return
    try {
      const created = await questionsApi.create({
        courseId: Number(id),
        questionType: qValues.questionType,
        questionText: qValues.questionText,
        options: qValues.questionType === 'MCQ' ? qValues.options.split('\n').map((o) => o.trim()).filter(Boolean) : null,
        correctAnswer: qValues.correctAnswer || null,
        points: Number(qValues.points) || 1,
        difficultyLevel: qValues.difficultyLevel,
      })
      setQuestions((list) => [...list, created])
      setShowQuestionForm(false)
      setQValues({ questionType: 'MCQ', questionText: '', options: '', correctAnswer: '', points: 1, difficultyLevel: 'MEDIUM' })
      toast.success('Question added to the course bank')
    } catch (err) { toast.error(err.message) }
  }
  async function handleDeleteQuestion(questionId) {
    if (!window.confirm('Remove this question from the bank?')) return
    try {
      await questionsApi.remove(questionId)
      setQuestions((list) => list.filter((q) => q.questionId !== questionId))
      toast.success('Question removed')
    } catch (e) { toast.error(e.message) }
  }

  function handleAssessmentClick(a) {
    if (!can('manageCourses')) {
      navigate(a.assessmentType === 'QUIZ' ? `/quizzes/${a.assessmentId}` : '/assignments')
    }
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!course) return <Loader label="Loading course…" />

  return (
    <div className="page">
      <button
        type="button"
        className="link-button"
        style={{ marginBottom: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', cursor: 'pointer' }}
        onClick={() => {
          if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
            navigate(-1)
          } else {
            navigate('/my-courses')
          }
        }}
      >
        <ChevronLeft size={16} /> Back to courses
      </button>
      <div className="page__head">
        <div>
          <span className="eyebrow">{course.category || 'General'} · {course.level}</span>
          <h1>{course.title}</h1>
          {manage && <StatusPill status={course.status} />}
        </div>
        {manage ? (
          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={() => setShowAnnounce(true)}><Megaphone size={14} /> Announce</button>
            <button type="button" className="btn btn--ghost" onClick={() => setShowEdit(true)}>Edit</button>
            {course.status !== 'PUBLISHED' && <button type="button" className="btn btn--ghost" onClick={handlePublishCourse}>Publish</button>}
            {course.status !== 'ARCHIVED' && <button type="button" className="btn btn--ghost" onClick={handleArchiveCourse}>Archive</button>}
            <button type="button" className="btn btn--danger" onClick={handleDeleteCourse}>Delete</button>
          </div>
        ) : can('enroll') ? (
          enrollment ? <StatusPill status={enrollment.status} /> : <button type="button" className="btn btn--accent" onClick={handleEnroll}>Enroll</button>
        ) : null}
      </div>

      <p className="muted" style={{ maxWidth: '70ch' }}>{course.description || 'No description provided.'}</p>

      <section className="panel">
        <div className="panel__head">
          <h2>Modules</h2>
          {manage && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShowModuleForm(true)}>Add module</button>}
        </div>
        {modules.length === 0 ? (
          <EmptyState title="No modules yet" hint={manage ? 'Add a module to start structuring this course.' : 'Content will appear once the instructor adds it.'} />
        ) : (
          <ul className="accordion">
            {modules.map((m) => (
              <li key={m.moduleId} className="accordion__item">
                <button type="button" className="accordion__trigger" onClick={() => toggleModule(m.moduleId)}>
                  <span>{m.title}</span>
                  <span className="accordion__meta">
                    {manage && <StatusPill status={m.published ? 'PUBLISHED' : 'DRAFT'} />}
                    <span className="chevron">{expanded === m.moduleId ? '−' : '+'}</span>
                  </span>
                </button>
                {expanded === m.moduleId && (
                  <div className="accordion__panel">
                    {!lessonsByModule[m.moduleId] ? <Loader label="Loading lessons…" /> : lessonsByModule[m.moduleId].length === 0 ? (
                      <p className="muted">No lessons in this module yet.</p>
                    ) : (
                      <ul className="list">
                        {lessonsByModule[m.moduleId].map((l) => (
                          <li key={l.lessonId}>
                            <span>{l.title} <span className="muted">· {l.contentType}</span></span>
                            {manage && <button type="button" className="btn btn--sm btn--ghost" onClick={() => handleDeleteLesson(m.moduleId, l.lessonId)}>Remove</button>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {manage && (
                      <div className="button-row" style={{ marginTop: '0.8rem' }}>
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => setLessonModal(m.moduleId)}>Add lesson</button>
                        {!m.published && <button type="button" className="btn btn--sm btn--ghost" onClick={() => handlePublishModule(m.moduleId)}>Publish module</button>}
                        <button type="button" className="btn btn--sm btn--danger" onClick={() => handleDeleteModule(m.moduleId)}>Delete module</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Assessments</h2>
          {manage ? (
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShowAssessmentForm(true)}>New assessment</button>
          ) : (
            <span className="muted">{assessments.length} total</span>
          )}
        </div>
        {assessments.length === 0 ? <EmptyState title="No assessments yet" /> : (
          <ul className="list">
            {assessments.map((a) => (
              <li key={a.assessmentId}>
                {manage ? (
                  <span>{a.title} <span className="muted">· {a.assessmentType}</span></span>
                ) : (
                  <button type="button" className="link-button" onClick={() => handleAssessmentClick(a)}>
                    {a.title} <span className="muted">· {a.assessmentType}</span>
                  </button>
                )}
                <span className="button-row">
                  <StatusPill status={a.published ? 'PUBLISHED' : 'DRAFT'} />
                  {manage && !a.published && <button type="button" className="btn btn--sm btn--ghost" onClick={() => handlePublishAssessment(a.assessmentId)}>Publish</button>}
                  {manage && <button type="button" className="btn btn--sm btn--danger" onClick={() => handleDeleteAssessment(a.assessmentId)}>Delete</button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(manage || questions.length > 0) && (
        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Question bank</h2>
              <p className="muted" style={{ margin: 0 }}>Shared across every quiz in this course.</p>
            </div>
            {manage && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShowQuestionForm(true)}>Add question</button>}
          </div>
          {questions.length === 0 ? <EmptyState title="No questions yet" /> : (
            <ul className="list">
              {questions.map((q) => (
                <li key={q.questionId}>
                  <span>{q.questionText} <span className="muted">· {q.questionType} · {q.points} pts</span></span>
                  {manage && <button type="button" className="btn btn--sm btn--ghost" onClick={() => handleDeleteQuestion(q.questionId)}>Remove</button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal title="Edit course" open={showEdit} onClose={() => setShowEdit(false)}>
        <CourseForm initial={course} onSubmit={handleUpdateCourse} onCancel={() => setShowEdit(false)} submitLabel="Save changes" />
      </Modal>

      <Modal title="Add module" open={showModuleForm} onClose={() => setShowModuleForm(false)}>
        <form onSubmit={handleCreateModule}>
          <Field label="Module title" name="moduleTitle" required value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowModuleForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--accent">Add module</button>
          </div>
        </form>
      </Modal>

      <Modal title="Add lesson" open={Boolean(lessonModal)} onClose={() => setLessonModal(null)}>
        <form onSubmit={handleCreateLesson}>
          <Field label="Lesson title" name="title" required value={lessonForm.title} onChange={(e) => setLessonForm((v) => ({ ...v, title: e.target.value }))} />
          <Field label="Content type" name="contentType" as="select" value={lessonForm.contentType} onChange={(e) => setLessonForm((v) => ({ ...v, contentType: e.target.value }))}>
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Field>
          <Field label="Content URL" name="contentUrl" hint={lessonFile ? 'Ignored — a file is selected below' : 'Optional — or upload a file instead'} disabled={Boolean(lessonFile)} value={lessonForm.contentUrl} onChange={(e) => setLessonForm((v) => ({ ...v, contentUrl: e.target.value }))} />
          <div className="field">
            <span className="field__label">Or upload a file</span>
            {lessonFile ? (
              <div className="button-row">
                <UploadCloud size={14} /> <span style={{ fontSize: '0.85rem' }}>{lessonFile.name}</span>
                <button type="button" className="btn btn--sm btn--ghost" onClick={() => setLessonFile(null)}>Remove</button>
              </div>
            ) : (
              <input type="file" onChange={(e) => setLessonFile(e.target.files?.[0] || null)} />
            )}
          </div>
          <Field label="Duration (seconds)" name="durationSeconds" type="number" min="0" hint="Optional" value={lessonForm.durationSeconds} onChange={(e) => setLessonForm((v) => ({ ...v, durationSeconds: e.target.value }))} />
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setLessonModal(null)}>Cancel</button>
            <button type="submit" className="btn btn--accent" disabled={uploadingLessonFile}>{uploadingLessonFile ? 'Uploading…' : 'Add lesson'}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Send announcement" open={showAnnounce} onClose={() => setShowAnnounce(false)}>
        <form onSubmit={handleSendAnnouncement}>
          <p className="muted" style={{ marginTop: 0 }}>Sent as an in-app notification to every enrolled student, and by email where email delivery is configured.</p>
          <Field label="Message" name="announceMessage" as="textarea" rows={4} required value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} />
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowAnnounce(false)}>Cancel</button>
            <button type="submit" className="btn btn--accent" disabled={sendingAnnounce}>{sendingAnnounce ? 'Sending…' : 'Send announcement'}</button>
          </div>
        </form>
      </Modal>
      <Modal title="New assessment" open={showAssessmentForm} onClose={() => setShowAssessmentForm(false)}>
        <form onSubmit={handleCreateAssessment} noValidate>
          <Field label="Title" name="title" required error={aErrors.title} value={aValues.title} onChange={handleAssessmentChange} />
          <div className="field-row">
            <Field label="Type" name="assessmentType" as="select" error={aErrors.assessmentType} value={aValues.assessmentType} onChange={handleAssessmentChange}>
              {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Field>
            <Field label="Time limit (minutes)" name="timeLimitMinutes" type="number" min="0" hint="Optional" error={aErrors.timeLimitMinutes} value={aValues.timeLimitMinutes} onChange={handleAssessmentChange} />
          </div>
          <div className="field-row">
            <Field label="Max points" name="maxPoints" type="number" min="0" step="0.5" hint="Optional" error={aErrors.maxPoints} value={aValues.maxPoints} onChange={handleAssessmentChange} />
            <Field label="Weight (%)" name="weightPercent" type="number" min="0" max="100" hint="Optional" value={aValues.weightPercent} onChange={handleAssessmentChange} />
          </div>
          <Field label="Due date" name="dueDate" type="datetime-local" hint="Optional" value={aValues.dueDate} onChange={handleAssessmentChange} />
          <label className="checkbox-row">
            <input type="checkbox" name="allowLateSubmission" checked={aValues.allowLateSubmission} onChange={handleAssessmentChange} />
            Allow late submission
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowAssessmentForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--accent">Create assessment</button>
          </div>
        </form>
      </Modal>

      <Modal title="Add question to bank" open={showQuestionForm} onClose={() => setShowQuestionForm(false)}>
        <form onSubmit={handleCreateQuestion} noValidate>
          <Field label="Question text" name="questionText" as="textarea" rows={3} required error={qErrors.questionText} value={qValues.questionText} onChange={handleQuestionChange} />
          <div className="field-row">
            <Field label="Type" name="questionType" as="select" value={qValues.questionType} onChange={handleQuestionChange}>
              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Field>
            <Field label="Difficulty" name="difficultyLevel" as="select" value={qValues.difficultyLevel} onChange={handleQuestionChange}>
              {['EASY', 'MEDIUM', 'HARD'].map((d) => <option key={d} value={d}>{d}</option>)}
            </Field>
          </div>
          {qValues.questionType === 'MCQ' && (
            <>
              <Field label="Options" name="options" as="textarea" rows={4} hint="One option per line" error={qErrors.options} value={qValues.options} onChange={handleQuestionChange} />
              <Field label="Correct answer" name="correctAnswer" hint="Must match one of the options exactly" error={qErrors.correctAnswer} value={qValues.correctAnswer} onChange={handleQuestionChange} />
            </>
          )}
          <Field label="Points" name="points" type="number" min="0.5" step="0.5" error={qErrors.points} value={qValues.points} onChange={handleQuestionChange} />
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowQuestionForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--accent">Add question</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
