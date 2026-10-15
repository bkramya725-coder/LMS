import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Notice, Loader } from '../components/Feedback'
import Field from '../components/Field'
import { enrollmentsApi } from '../api/enrollments'
import { submissionsApi } from '../api/submissions'
import { timeAgo, initials } from '../utils/format'

const TABS = ['Profile Info', 'Change Password', 'Activity']

export default function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Profile Info')
  const [activity, setActivity] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })

  useEffect(() => {
    if (tab !== 'Activity' || activity) return
    Promise.all([enrollmentsApi.mine().catch(() => []), submissionsApi.mine().catch(() => [])]).then(([enrollments, submissions]) => {
      const events = [
        ...enrollments.map((e) => ({ date: e.enrolledDate, text: `Enrolled in "${e.course?.title}"` })),
        ...enrollments.filter((e) => e.completedDate).map((e) => ({ date: e.completedDate, text: `Completed "${e.course?.title}"` })),
        ...submissions.map((s) => ({ date: s.submittedDate, text: `Submitted "${s.assessment?.title}"` })),
      ].filter((e) => e.date).sort((a, b) => new Date(b.date) - new Date(a.date))
      setActivity(events)
    })
  }, [tab, activity])

  const [first, ...rest] = (user?.fullName || '').split(' ')
  const last = rest.join(' ')

  return (
    <div className="page page--narrow">
      <h1>My Profile</h1>
      <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span className="avatar avatar--lg avatar--gold">{initials(user?.fullName)}</span>
        <div><h2 style={{ margin: 0 }}>{user?.fullName}</h2><p className="muted" style={{ margin: 0 }}>{user?.role?.replace(/_/g, ' ')} · {user?.email}</p></div>
      </div>

      <div className="tab-row">
        {TABS.map((t) => <button key={t} type="button" className={`tab-btn${tab === t ? ' is-active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Profile Info' && (
        <div className="panel">
          <Notice tone="info">Account details come from registration. The API doesn't yet expose a profile-update endpoint, so these fields are read-only here.</Notice>
          <div className="field-row">
            <Field label="First name" name="firstName" value={first || ''} disabled onChange={() => {}} />
            <Field label="Last name" name="lastName" value={last || ''} disabled onChange={() => {}} />
          </div>
          <div className="field-row">
            <Field label="Email address" name="email" value={user?.email || ''} disabled onChange={() => {}} />
            <Field label="Role" name="role" value={user?.role?.replace(/_/g, ' ') || ''} disabled onChange={() => {}} />
          </div>
          <Field label="User ID" name="userId" value={String(user?.userId ?? '')} disabled onChange={() => {}} />
        </div>
      )}

      {tab === 'Change Password' && (
        <div className="panel">
          <Notice tone="warn">The API doesn't currently expose a change-password endpoint, so this form can't submit yet — it's shown for completeness of the design.</Notice>
          <Field label="Current password" name="current" type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((v) => ({ ...v, current: e.target.value }))} />
          <Field label="New password" name="next" type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((v) => ({ ...v, next: e.target.value }))} />
          <Field label="Confirm new password" name="confirm" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((v) => ({ ...v, confirm: e.target.value }))} />
          <button type="button" className="btn btn--accent" disabled>Update password</button>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="panel">
          {!activity ? <Loader label="Loading activity…" /> : activity.length === 0 ? <p className="muted">No activity yet.</p> : (
            <ul className="list">{activity.map((a, i) => <li key={i}><span>{a.text}</span><span className="muted">{timeAgo(a.date)}</span></li>)}</ul>
          )}
        </div>
      )}
    </div>
  )
}
