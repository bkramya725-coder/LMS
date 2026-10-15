export function initials(fullName) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
export function timeAgo(value) {
  if (!value) return '—'
  const diffMs = Date.now() - new Date(value).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}
const THUMB_PALETTE = [
  ['#EEF2FF', '#4F46E5'], ['#FCE7F3', '#DB2777'], ['#ECFDF5', '#059669'],
  ['#FFF7ED', '#EA580C'], ['#F0F9FF', '#0284C7'], ['#FAF5FF', '#9333EA'],
]
export function categoryColor(category) {
  const str = category || 'General'
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i)
  return THUMB_PALETTE[Math.abs(hash) % THUMB_PALETTE.length]
}
