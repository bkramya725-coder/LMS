import { BookOpen } from 'lucide-react'
import { categoryColor } from '../utils/format'

// A deterministic duotone thumbnail keyed by category, standing in for a
// real course image. Same category always renders the same treatment.
export default function CourseThumb({ category, level, children }) {
  const [bg, fg] = categoryColor(category)
  return (
    <div className="course-card__thumb" style={{ background: bg }}>
      <BookOpen size={26} color={fg} style={{ position: 'absolute', top: '0.7rem', right: '0.8rem', opacity: 0.55 }} />
      {level && <span className="course-card__level">{level}</span>}
      {children}
    </div>
  )
}
