import { useEffect, useState } from 'react'
import { coursesApi } from '../api/courses'

// A compact trust strip shown below the auth card — replaces the old
// full-height split-panel hero. Pulls a real, live course count instead
// of a fabricated marketing number.
export default function AuthTrustStrip() {
  const [courseCount, setCourseCount] = useState(null)

  useEffect(() => {
    coursesApi.listPublished().then((data) => setCourseCount(data.length)).catch(() => setCourseCount(null))
  }, [])

  return (
    <div className="auth-trust">
      <div className="auth-trust-stat"><strong>{courseCount ?? '—'}</strong><span>Published courses</span></div>
      <div className="auth-trust-stat"><strong>6</strong><span>Role types</span></div>
      <div className="auth-trust-stat"><strong>Live</strong><span>Connected API</span></div>
    </div>
  )
}
