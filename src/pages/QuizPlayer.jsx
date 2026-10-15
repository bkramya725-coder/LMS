import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assessmentsApi, questionsApi } from '../api/assessments'
import { submissionsApi } from '../api/submissions'
import { useToast } from '../components/useToast'
import { Loader, Notice } from '../components/Feedback'

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function QuizPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [assessment, setAssessment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    async function load() {
      try {
        const a = await assessmentsApi.getById(id)
        setAssessment(a)
        const qs = await questionsApi.listByCourse(a.course.courseId)
        setQuestions(qs)
        const mine = await submissionsApi.mine().catch(() => [])
        const existing = mine.find((s) => s.assessment?.assessmentId === Number(id))
        setExistingSubmission(existing || null)
        if (!existing && a.timeLimitMinutes) setSecondsLeft(a.timeLimitMinutes * 60)
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (secondsLeft == null || existingSubmission) return
    if (secondsLeft <= 0) {
      if (!submittedRef.current) handleSubmit()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, existingSubmission])

  function updateAnswer(questionId, value) {
    setAnswers((a) => ({ ...a, [questionId]: value }))
  }

  async function handleSubmit() {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      const created = await submissionsApi.submit({ assessmentId: Number(id), fileUrl: null, answers })
      setExistingSubmission(created)
      toast.success('Quiz submitted')
    } catch (e) {
      toast.error(e.message)
      submittedRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!assessment || !questions) return <Loader label="Loading quiz…" />

  if (existingSubmission) {
    return (
      <div className="page page--narrow">
        <h1>{assessment.title}</h1>
        <div className="panel">
          <p>You already submitted this quiz on {new Date(existingSubmission.submittedDate).toLocaleString()}.</p>
          {existingSubmission.score != null && <p>Score: {existingSubmission.score} / {assessment.maxPoints ?? '—'}</p>}
          {existingSubmission.feedback && <Notice tone="info">{existingSubmission.feedback}</Notice>}
          <button type="button" className="btn btn--ghost" onClick={() => (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0 ? navigate(-1) : navigate('/quizzes'))}>Back to quizzes</button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="page page--narrow">
        <h1>{assessment.title}</h1>
        <Notice tone="info">This course's question bank is empty — ask your instructor to add questions before this quiz can be taken.</Notice>
        <button type="button" className="btn btn--ghost" style={{ marginTop: '1rem' }} onClick={() => (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0 ? navigate(-1) : navigate('/quizzes'))}>Back to quizzes</button>
      </div>
    )
  }

  const question = questions[index]
  const answered = Object.keys(answers).length

  return (
    <div className="page">
      <div className="quiz-player">
        <div className="quiz-player__head">
          <div>
            <h2 style={{ margin: 0 }}>{assessment.title}</h2>
            <span className="muted">{assessment.course?.title} · Question {index + 1} of {questions.length}</span>
          </div>
          {secondsLeft != null && <span className="quiz-timer">{formatClock(secondsLeft)}</span>}
        </div>

        <div className="progress-track" style={{ marginBottom: '0.4rem' }}><div className="progress-track__fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
        <span className="muted">{answered} answered</span>

        <p className="quiz-question">{question.questionText}</p>

        {question.questionType === 'MCQ' && question.options?.length ? (
          <div className="radio-group">
            {question.options.map((opt) => (
              <label key={opt} className={`radio-option${answers[question.questionId] === opt ? ' is-selected' : ''}`}>
                <input type="radio" name={`q-${question.questionId}`} checked={answers[question.questionId] === opt} onChange={() => updateAnswer(question.questionId, opt)} />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <textarea className="field__control" rows={4} value={answers[question.questionId] || ''} onChange={(e) => updateAnswer(question.questionId, e.target.value)} />
        )}

        <div className="form-actions" style={{ justifyContent: 'space-between', marginTop: '1.4rem' }}>
          <button type="button" className="btn btn--ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Previous</button>
          {index < questions.length - 1 ? (
            <button type="button" className="btn btn--accent" onClick={() => setIndex((i) => i + 1)}>Next</button>
          ) : (
            <button type="button" className="btn btn--accent" disabled={submitting} onClick={handleSubmit}>{submitting ? 'Submitting…' : 'Submit quiz'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
