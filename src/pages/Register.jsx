import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, BookOpen, ShieldCheck, Eye, EyeOff, ChevronLeft } from 'lucide-react'
import AuthTrustStrip from '../components/AuthTrustStrip'
import Field from '../components/Field'
import { Notice } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { validateRegister, NAME_PATTERN, EMAIL_PATTERN, PHONE_PATTERN } from '../utils/validators'

const PRIMARY_ROLES = [
  { value: 'STUDENT', label: 'Student', hint: 'Learn & grow', icon: GraduationCap },
  { value: 'INSTRUCTOR', label: 'Instructor', hint: 'Teach & earn', icon: BookOpen },
  { value: 'ADMIN', label: 'Admin', hint: 'Manage all', icon: ShieldCheck },
]
const OTHER_ROLES = ['TUTOR', 'PARENT', 'DEPARTMENT_HEAD']

function scorePassword(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}
const STRENGTH_META = [
  { label: 'Too short', color: 'var(--bad)' },
  { label: 'Weak', color: 'var(--bad)' },
  { label: 'Fair', color: 'var(--warn)' },
  { label: 'Good', color: 'var(--info)' },
  { label: 'Strong', color: 'var(--good)' },
]

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawStep = parseInt(searchParams.get('step') || '1', 10)
  const step = isNaN(rawStep) || rawStep < 1 || rawStep > 3 ? 1 : rawStep

  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOtherRoles, setShowOtherRoles] = useState(false)
  const [serverError, setServerError] = useState('')
  const [stepErrors, setStepErrors] = useState({})

  const [values, setValues] = useState({
    fullName: '', email: '', phoneNumber: '', role: 'STUDENT', department: '',
    institutionId: '', rollNumber: '', facultyNumber: '', password: '',
  })

  function goToStep(targetStep, replace = false) {
    const nextStep = Math.min(Math.max(targetStep, 1), 3)
    setSearchParams({ step: String(nextStep) }, { replace })
  }

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  function validateStep1() {
    const errors = {}
    if (!values.fullName.trim()) errors.fullName = 'Full name is required'
    else if (!NAME_PATTERN.test(values.fullName.trim())) errors.fullName = 'Letters and spaces only'
    if (!values.email.trim()) errors.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address'
    if (values.phoneNumber && !PHONE_PATTERN.test(values.phoneNumber)) errors.phoneNumber = 'Must be exactly 10 digits'
    return errors
  }

  function goNext() {
    if (step === 1) {
      const errors = validateStep1()
      setStepErrors(errors)
      if (Object.keys(errors).length) return
    }
    setStepErrors({})
    goToStep(step + 1)
  }

  function goBack() {
    setStepErrors({})
    if (step > 1) {
      if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
        navigate(-1)
      } else {
        goToStep(step - 1, true)
      }
    } else {
      navigate('/login')
    }
  }

  async function handleFinalSubmit(e) {
    e.preventDefault()
    const errors = validateRegister(values)
    if (values.password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setStepErrors(errors)
    if (Object.keys(errors).length) {
      if (errors.fullName || errors.email || errors.phoneNumber) {
        goToStep(1)
      } else if (errors.role) {
        goToStep(2)
      }
      return
    }

    setServerError('')
    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        role: values.role,
        password: values.password,
        phoneNumber: values.phoneNumber?.trim() || null,
        department: values.department?.trim() || null,
        institutionId: values.institutionId?.trim() || null,
        rollNumber: values.rollNumber?.trim() || null,
        facultyNumber: values.facultyNumber?.trim() || null,
      }
      await register(payload)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message)
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setStepErrors(err.fieldErrors)
        if (err.fieldErrors.fullName || err.fieldErrors.email || err.fieldErrors.phoneNumber) {
          goToStep(1)
        } else if (err.fieldErrors.role || err.fieldErrors.department || err.fieldErrors.rollNumber || err.fieldErrors.facultyNumber || err.fieldErrors.institutionId) {
          goToStep(2)
        }
      }
    }
  }

  const strength = scorePassword(values.password)

  return (
    <div className="auth-page">
      <header className="auth-page__topbar">
        <Link to="/login" className="auth-page__brand">
          <span className="auth-page__brand-mark"><GraduationCap size={16} /></span>
          LearnFlow
        </Link>
        <span className="auth-page__topbar-link">Already have an account?<Link to="/login">Sign in</Link></span>
      </header>

      <div className="auth-page__main">
        <div className="auth-card auth-card--wide">
        <div className="auth-form">
          <button type="button" className="link-button" style={{ marginBottom: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', cursor: 'pointer' }} onClick={goBack}>
            <ChevronLeft size={15} /> Back
          </button>
          <h1>Create account</h1>
          <p className="auth-card__sub">Step {step} of 3</p>

          <div className="wizard-progress">
            {[1, 2, 3].map((n) => <span key={n} className={`wizard-progress__step${n <= step ? ' is-done' : ''}`} />)}
          </div>

          <Notice tone="error">{serverError}</Notice>

          {step === 1 && (
            <>
              <span className="wizard-step-label">Personal information</span>
              <Field label="Full name" name="fullName" required error={stepErrors.fullName} value={values.fullName} onChange={handleChange} hint="Alphabets only" />
              <Field label="Email address" name="email" type="email" required error={stepErrors.email} value={values.email} onChange={handleChange} />
              <Field label="Phone number" name="phoneNumber" error={stepErrors.phoneNumber} value={values.phoneNumber} onChange={handleChange} hint={`${values.phoneNumber.length}/10 digits — optional`} />
              <button type="button" className="btn btn--accent btn--block" onClick={goNext}>Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <span className="wizard-step-label">Role & specialization</span>
              <p style={{ marginTop: 0, marginBottom: '0.6rem', fontSize: '0.85rem' }}>I am a...</p>
              <div className="role-card-grid">
                {PRIMARY_ROLES.map(({ value, label, hint, icon: Icon }) => (
                  <button key={value} type="button" className={`role-card${values.role === value ? ' is-active' : ''}`} onClick={() => setValues((v) => ({ ...v, role: value }))}>
                    <span className="role-card__icon"><Icon size={16} /></span>
                    {label}
                    <span className="muted" style={{ fontWeight: 400, fontSize: '0.7rem' }}>{hint}</span>
                  </button>
                ))}
              </div>

              {!showOtherRoles ? (
                <button type="button" className="link-button" style={{ fontSize: '0.8rem', marginBottom: '1rem', textDecoration: 'none' }} onClick={() => setShowOtherRoles(true)}>
                  Not one of these? Choose Tutor, Parent, or Department Head
                </button>
              ) : (
                <Field label="Other role" name="role" as="select" value={values.role} onChange={handleChange}>
                  {OTHER_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </Field>
              )}

              <Field label="Domain / Specialization" name="department" hint="Optional — e.g. Web Development, Data Science" value={values.department} onChange={handleChange} />
              {values.role === 'STUDENT' && <Field label="Roll number" name="rollNumber" hint="Optional" value={values.rollNumber} onChange={handleChange} />}
              {values.role === 'INSTRUCTOR' && <Field label="Faculty number" name="facultyNumber" hint="Optional" value={values.facultyNumber} onChange={handleChange} />}
              <Field label="Institution ID" name="institutionId" hint="Optional" value={values.institutionId} onChange={handleChange} />

              <button type="button" className="btn btn--accent btn--block" onClick={goNext}>Continue</button>
            </>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} noValidate>
              <span className="wizard-step-label">Set your password</span>
              <Field label="Password" name="password" type={showPassword ? 'text' : 'password'} required error={stepErrors.password} value={values.password} onChange={handleChange} />
              <div className="password-strength" style={{ marginTop: '-0.55rem', marginBottom: '0.3rem' }}>
                <div className="password-strength__fill" style={{ width: `${(strength / 4) * 100}%`, background: STRENGTH_META[strength].color }} />
              </div>
              <p className="muted" style={{ marginTop: 0, marginBottom: '0.9rem' }}>{STRENGTH_META[strength].label} — at least 8 characters</p>

              <Field
                label="Confirm password" name="confirmPassword" type={showPassword ? 'text' : 'password'} required
                error={stepErrors.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                hint={confirmPassword && confirmPassword === values.password ? 'Passwords match' : undefined}
              />
              <label className="checkbox-row">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} Show password
              </label>

              <button type="submit" className="btn btn--accent btn--block" disabled={loading}>
                {loading ? 'Creating account…' : 'Create my account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.88rem' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
        </div>
      </div>

      <AuthTrustStrip />
    </div>
  )
}
