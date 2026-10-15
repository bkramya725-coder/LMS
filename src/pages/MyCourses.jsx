import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { coursesApi } from '../api/courses'
import { enrollmentsApi } from '../api/enrollments'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/useToast'
import { CardGridSkeleton, EmptyState, StatusPill, RatingStars } from '../components/Feedback'
import CourseThumb from '../components/CourseThumb'
import Modal from '../components/Modal'
import CourseForm from './CourseForm'
import { initials } from '../utils/format'

const LEVELS = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export default function MyCourses() {
  const { can, user } = useAuth()
  const toast = useToast()
  const manage = can('manageCourses')
  const canCreate = can('createCourse')

  const [courses, setCourses] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('All')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('popular')
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    try {
      const data = manage ? await coursesApi.listAll() : await coursesApi.listPublished()
      setCourses(manage && user.role === 'INSTRUCTOR' ? data.filter((c) => c.instructor?.user?.userId === user.userId) : data)
      if (can('enroll')) setEnrollments(await enrollmentsApi.mine().catch(() => []))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleCreate(payload) {
    const created = await coursesApi.create(payload)
    setCourses((list) => [created, ...(list || [])])
    setShowCreate(false)
    toast.success('Course created as a draft')
  }

  async function handleEnroll(courseId) {
    try {
      const created = await enrollmentsApi.enroll(courseId)
      setEnrollments((list) => [...list, created])
      toast.success('Enrolled — happy learning!')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const categories = useMemo(() => ['All', ...new Set((courses || []).map((c) => c.category).filter(Boolean))], [courses])

  const filtered = useMemo(() => {
    let list = (courses || []).filter((c) => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)
      const matchesLevel = level === 'All' || c.level === level
      const matchesCategory = category === 'All' || c.category === category
      return matchesSearch && matchesLevel && matchesCategory
    })
    if (sort === 'popular') list = [...list].sort((a, b) => Number(b.ratingAvg || 0) - Number(a.ratingAvg || 0))
    if (sort === 'price') list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
    return list
  }, [courses, search, level, category, sort])

  const enrollmentByCourseId = useMemo(() => {
    const map = new Map()
    enrollments.forEach((e) => map.set(e.course?.courseId, e))
    return map
  }, [enrollments])

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1>{manage ? 'My Courses' : 'Course Catalog'}</h1>
          <p className="muted">
            {manage
              ? user.role === 'INSTRUCTOR' ? 'Manage the courses you teach.' : 'Every course on the platform, including drafts and archives.'
              : `${courses?.length ?? '…'} courses across every discipline.`}
          </p>
        </div>
        {canCreate && (
          <button type="button" className="btn btn--accent" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New course
          </button>
        )}
      </div>

      <div className="button-row" style={{ marginBottom: '1rem' }}>
        <div className="search-input-wrap">
          <Search size={15} />
          <input className="search-input" placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="field__control" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="price">Price: low to high</option>
        </select>
      </div>

      <div className="tab-row">
        {categories.map((c) => <button key={c} type="button" className={`tab-btn${category === c ? ' is-active' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      <div className="tab-row">
        {LEVELS.map((l) => <button key={l} type="button" className={`tab-btn${level === l ? ' is-active' : ''}`} onClick={() => setLevel(l)}>{l === 'All' ? 'All levels' : l.charAt(0) + l.slice(1).toLowerCase()}</button>)}
      </div>

      {error && <p className="notice notice--error">{error}</p>}
      {!courses && !error && <CardGridSkeleton />}
      {courses && filtered.length === 0 && (
        <EmptyState title="No courses found" hint={canCreate ? 'Create your first course to get started.' : 'Try a different search or filter.'} />
      )}

      <div className="card-grid">
        {filtered.map((c) => {
          const enrollment = enrollmentByCourseId.get(c.courseId)
          return (
            <div key={c.courseId} className="course-card">
              <Link to={`/courses/${c.courseId}`} style={{ display: 'contents' }}>
                <CourseThumb category={c.category} level={c.level} />
              </Link>
              <div className="course-card__body">
                <span className="course-card__category">{c.category || 'General'}</span>
                <Link to={`/courses/${c.courseId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{c.title}</h3>
                </Link>
                {c.instructor?.user?.fullName && (
                  <div className="course-card__instructor">
                    <span className="avatar" style={{ width: 20, height: 20, fontSize: '0.6rem' }}>{initials(c.instructor.user.fullName)}</span>
                    {c.instructor.user.fullName}
                  </div>
                )}
                <RatingStars rating={c.ratingAvg} />

                {manage && <StatusPill status={c.status} />}
                {enrollment && (
                  <div className="progress-track" style={{ marginTop: '0.2rem' }}>
                    <div className="progress-track__fill" style={{ width: `${enrollment.progressPercent || 0}%` }} />
                  </div>
                )}

                <div className="course-card__meta">
                  <span className="course-card__price">{Number(c.price) > 0 ? `$${Number(c.price).toFixed(2)}` : 'Free'}</span>
                  {can('enroll') && !manage && (
                    enrollment ? (
                      <Link to={`/learn/${enrollment.enrollmentId}`} className="btn btn--accent btn--sm">Continue</Link>
                    ) : (
                      <button type="button" className="btn btn--accent btn--sm" onClick={() => handleEnroll(c.courseId)}>Enroll</button>
                    )
                  )}
                  {manage && <Link to={`/courses/${c.courseId}`} className="btn btn--ghost btn--sm">Manage</Link>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal title="Create a course" open={showCreate} onClose={() => setShowCreate(false)}>
        <CourseForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Create course" />
      </Modal>
    </div>
  )
}
