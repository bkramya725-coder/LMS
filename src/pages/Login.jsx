import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, ShieldCheck } from 'lucide-react'
import AuthTrustStrip from '../components/AuthTrustStrip'
import Field from '../components/Field'
import { Notice } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { validateLogin } from '../utils/validators'

const ROLE_TABS = [
  { value: 'STUDENT', label: 'Student', icon: GraduationCap },
  { value: 'INSTRUCTOR', label: 'Instructor', icon: BookOpen },
  { value: 'ADMIN', label: 'Admin', icon: ShieldCheck },
]

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expectedRole, setExpectedRole] = useState('STUDENT')
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [roleMismatch, setRoleMismatch] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fieldErrors = validateLogin(values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return

    setServerError('')
    setRoleMismatch('')
    try {
      const authUser = await login(values)
      if (authUser.role !== expectedRole) {
        setRoleMismatch(`This account is registered as ${authUser.role.replace(/_/g, ' ')}, not ${expectedRole.replace(/_/g, ' ')}. Signing you in with its real role.`)
      }
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-page__topbar">
        <Link to="/login" className="auth-page__brand">
          <span className="auth-page__brand-mark"><GraduationCap size={16} /></span>
          LearnFlow
        </Link>
        <span className="auth-page__topbar-link">New here?<Link to="/register">Create an account</Link></span>
      </header>

      <div className="auth-page__main">
        <div className="auth-card">
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <h1>Welcome back</h1>
            <p className="auth-card__sub">Sign in to continue your learning journey</p>

            <span className="wizard-step-label">Demo — select a role to preview</span>
            <div className="role-tabs">
              {ROLE_TABS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" className={`role-tab${expectedRole === value ? ' is-active' : ''}`} onClick={() => setExpectedRole(value)}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <Notice tone="error">{serverError}</Notice>
            <Notice tone="info">{roleMismatch}</Notice>

            <Field label="Email address" name="email" type="email" required error={errors.email} value={values.email} onChange={handleChange} />
            <Field label="Password" name="password" type="password" required error={errors.password} value={values.password} onChange={handleChange} />

            <button type="submit" className="btn btn--accent btn--block" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in to LearnFlow'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.88rem' }}>
              Don't have an account? <Link to="/register">Create account</Link>
            </p>
          </form>
        </div>
      </div>

      <AuthTrustStrip />
    </div>
  )
}
