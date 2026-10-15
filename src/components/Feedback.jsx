import { Star } from 'lucide-react'

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status">
      <span className="loader__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

// A grid of skeleton course-card placeholders, used instead of a bare
// spinner on card-grid pages so the layout doesn't jump once data arrives.
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="card-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-card__thumb" />
          <div className="skeleton-card__body">
            <div className="skeleton skeleton-line" style={{ width: '40%' }} />
            <div className="skeleton skeleton-line" style={{ width: '85%', height: 16 }} />
            <div className="skeleton skeleton-line" style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <table className="data-table" aria-hidden="true">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <div className="skeleton skeleton-line" style={{ width: c === 0 ? '70%' : '50%' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  )
}

export function Notice({ tone = 'info', children }) {
  if (!children) return null
  return <div className={`notice notice--${tone}`}>{children}</div>
}

const TONE_BY_STATUS = {
  DRAFT: 'neutral', PUBLISHED: 'good', ARCHIVED: 'muted', ENROLLED: 'info',
  IN_PROGRESS: 'info', COMPLETED: 'good', WITHDRAWN: 'muted', PENDING: 'neutral',
  SUBMITTED: 'info', GRADED: 'good', LATE: 'warn', PENDING_MODERATION: 'warn',
}

export function StatusPill({ status }) {
  if (!status) return null
  const tone = TONE_BY_STATUS[status] || 'neutral'
  return <span className={`pill pill--${tone}`}>{status.replace(/_/g, ' ')}</span>
}

// Rating stars for course cards. Rounds to the nearest half-star visually
// by simply filling whole stars up to Math.round(rating) — real platforms
// mostly show a rounded aggregate rather than true half-star SVGs.
export function RatingStars({ rating, count }) {
  const filled = Math.round(Number(rating) || 0)
  return (
    <span className="rating-row">
      <span className="stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} fill={i < filled ? 'currentColor' : 'none'} strokeWidth={1.5} />
        ))}
      </span>
      {rating ? Number(rating).toFixed(1) : 'New'}
      {count != null && <span className="faint">&nbsp;({count})</span>}
    </span>
  )
}
