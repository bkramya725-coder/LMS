import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ClipboardCheck } from 'lucide-react'
import { notificationsApi } from '../api/misc'
import { Loader, EmptyState } from '../components/Feedback'
import { timeAgo } from '../utils/format'

// Where a notification should send the person once they act on it — an
// instructor tapping "Alex submitted..." should land on Grading, not just
// get marked as read with nowhere to go.
const TYPE_DESTINATION = {
  SUBMISSION_RECEIVED: '/grading',
  GRADE_PUBLISHED: '/assignments',
}
const TYPE_ICON = { SUBMISSION_RECEIVED: ClipboardCheck }

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => { notificationsApi.mine().then(setItems).catch((e) => setError(e.message)) }, [])

  async function handleMarkRead(id) {
    try { setItems((list) => list.map((n) => (n.messageId === id ? { ...n, read: true } : n))); await notificationsApi.markRead(id) }
    catch { /* non-blocking */ }
  }

  function handleOpen(n) {
    if (!n.read) handleMarkRead(n.messageId)
    const destination = TYPE_DESTINATION[n.notificationType]
    if (destination) navigate(destination)
  }

  async function handleMarkAllRead() {
    const unread = items.filter((n) => !n.read)
    if (unread.length === 0) return
    setMarkingAll(true)
    try { await Promise.all(unread.map((n) => notificationsApi.markRead(n.messageId))); setItems((list) => list.map((n) => ({ ...n, read: true }))) }
    finally { setMarkingAll(false) }
  }

  if (error) return <p className="notice notice--error">{error}</p>
  if (!items) return <Loader label="Loading notifications…" />

  const unreadCount = items.filter((n) => !n.read).length
  const filtered = filter === 'Unread' ? items.filter((n) => !n.read) : items

  return (
    <div className="page">
      <div className="page__head">
        <div><h1>Notifications</h1><p className="muted">{unreadCount} unread</p></div>
        <button type="button" className="btn btn--ghost btn--sm" disabled={markingAll || unreadCount === 0} onClick={handleMarkAllRead}><CheckCheck size={14} /> Mark all as read</button>
      </div>
      <div className="tab-row">
        {['All', 'Unread'].map((f) => <button key={f} type="button" className={`tab-btn${filter === f ? ' is-active' : ''}`} onClick={() => setFilter(f)}>{f}{f === 'Unread' ? ` (${unreadCount})` : ''}</button>)}
      </div>
      {filtered.length === 0 ? <EmptyState title="You're all caught up" /> : (
        <ul className="notification-list">
          {filtered.map((n) => {
            const Icon = TYPE_ICON[n.notificationType] || Bell
            return (
              <li key={n.messageId} className={n.read ? 'is-read' : ''} onClick={() => handleOpen(n)}>
                <span className="notification-list__icon"><Icon size={14} /></span>
                <div><p style={{ margin: 0 }}>{n.message}</p><span className="muted">{n.notificationType} · {n.sentDate ? timeAgo(n.sentDate) : 'Pending'}</span></div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
