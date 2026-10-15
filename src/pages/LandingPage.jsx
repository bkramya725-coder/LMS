import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap, BookOpen, Award, CheckCircle2, ArrowRight,
  ShieldCheck, BarChart3, Users, Play, Clock, Star, Sparkles,
  Search, FileText, ChevronRight, Compass, Shield, Zap,
  Check, ArrowUpRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { coursesApi } from '../api/courses'

const FEATURED_COURSES_FALLBACK = [
  {
    id: 1,
    title: 'Full-Stack Web Architecture & Cloud Deployment',
    instructor: 'Dr. Elena Rostova',
    category: 'Computer Science',
    duration: '12 Weeks',
    modulesCount: 8,
    level: 'Advanced',
    rating: 4.9,
    reviews: 320,
    badge: 'Popular',
    desc: 'Master scalable backend services, React client architectures, microservices, and enterprise CI/CD pipelines.'
  },
  {
    id: 2,
    title: 'Machine Learning Systems & Deep Neural Networks',
    instructor: 'Prof. Marcus Vance',
    category: 'Data Science & AI',
    duration: '10 Weeks',
    modulesCount: 6,
    level: 'Intermediate',
    rating: 4.85,
    reviews: 215,
    badge: 'Featured',
    desc: 'End-to-end ML model design, feature pipelines, transformer models, and real-time inference optimization.'
  },
  {
    id: 3,
    title: 'Modern Applied Cryptography & Security Engineering',
    instructor: 'Sarah Jenkins, CISSP',
    category: 'Cybersecurity',
    duration: '8 Weeks',
    modulesCount: 6,
    level: 'Advanced',
    rating: 4.95,
    reviews: 180,
    badge: 'High Demand',
    desc: 'Rigorous foundations of asymmetric key protocols, zero-knowledge proofs, and secure distributed protocols.'
  },
  {
    id: 4,
    title: 'Interactive UI/UX Design & Design Systems',
    instructor: 'David Chen',
    category: 'Design & Product',
    duration: '6 Weeks',
    modulesCount: 5,
    level: 'Beginner - Intermediate',
    rating: 4.9,
    reviews: 410,
    badge: 'Trending',
    desc: 'Create cohesive component systems, accessible user interactions, high-fidelity prototypes, and design tokens.'
  }
]

const ROLE_PERKS = {
  STUDENT: {
    title: 'For Ambitious Students',
    tagline: 'Structured learning, instant evaluation, and credentials that carry real weight.',
    bullets: [
      'Interactive Course Player with video, rich text, and downloadable research resources.',
      'Timed, self-scoring quizzes with in-depth question breakdowns and rationale.',
      'Assignment submission portals with transparent rubric criteria and instructor commentary.',
      'Cryptographically verified digital certificates with public shareable verification links.'
    ],
    ctaText: 'Start Learning Free',
    ctaLink: '/register',
    stat: '98.4% Course Completion Rate'
  },
  INSTRUCTOR: {
    title: 'For Distinguished Educators',
    tagline: 'Author high-impact courses, evaluate submissions effortlessly, and monitor cohorts.',
    bullets: [
      'Visual syllabus architect: create modules, upload lecture media, and structure prerequisites.',
      'Centralized grading workbench with automated rubrics, PDF inspection, and bulk feedback.',
      'Comprehensive roster analytics tracking student retention, quiz difficulty, and pacing.',
      'One-click course publishing, announcement broadcasting, and certificate issuance.'
    ],
    ctaText: 'Teach on LearnFlow',
    ctaLink: '/register',
    stat: '10x Faster Cohort Grading'
  },
  ADMIN: {
    title: 'For Institutional Leaders',
    tagline: 'Enterprise-grade governance, role provisioning, and institutional reporting.',
    bullets: [
      'Granular Role-Based Access Control (RBAC) across Students, Instructors, and Dept Heads.',
      'Platform-wide audit trails, course approval workflows, and enrollment metrics.',
      'Automated credential hashing and tamper-evident certificate verification engine.',
      'Custom branding, seamless database health oversight, and real-time telemetry.'
    ],
    ctaText: 'Request Institutional Access',
    ctaLink: '/register',
    stat: '99.99% Uptime & Compliance'
  }
}

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeRole, setActiveRole] = useState('STUDENT')
  const [publishedCourses, setPublishedCourses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let active = true
    coursesApi.listPublished()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setPublishedCourses(data)
        }
      })
      .catch(() => {
        // Fallback data handles this seamlessly
      })
    return () => { active = false }
  }, [])

  const displayCourses = publishedCourses.length > 0
    ? publishedCourses.map((c, i) => ({
        id: c.id,
        title: c.title,
        instructor: c.instructor?.fullName || 'Distinguished Faculty',
        category: c.category || 'Academic Course',
        duration: 'Self-paced',
        modulesCount: c.modules?.length || 4,
        level: c.level || 'All Levels',
        rating: 4.9,
        reviews: 120 + i * 45,
        badge: i === 0 ? 'Featured' : 'Published',
        desc: c.description || 'Comprehensive curriculum designed for rigorous mastery and academic excellence.'
      }))
    : FEATURED_COURSES_FALLBACK

  const filteredCourses = searchQuery.trim()
    ? displayCourses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayCourses

  return (
    <div className="landing-page">
      {/* ---------- Navigation Header ---------- */}
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/" className="landing-brand">
            <span className="landing-brand__mark">
              <GraduationCap size={20} />
            </span>
            <span className="landing-brand__text">
              <span className="landing-brand__title">LearnFlow</span>
              <span className="landing-brand__tag">Academic Suite</span>
            </span>
          </Link>

          <nav className="landing-nav__links">
            <a href="#features" className="landing-nav__link">Features</a>
            <a href="#courses" className="landing-nav__link">Courses</a>
            <a href="#roles" className="landing-nav__link">Solutions</a>
            <Link to="/verify-certificate" className="landing-nav__link landing-nav__link--badge">
              <ShieldCheck size={14} />
              Verify Certificate
            </Link>
          </nav>

          <div className="landing-nav__actions">
            {user ? (
              <Link to="/dashboard" className="btn btn--accent landing-nav__cta">
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost landing-nav__btn-login">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn--gold landing-nav__cta">
                  <span>Get Started</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------- Hero Section ---------- */}
      <section className="landing-hero">
        <div className="landing-hero__ambient-1" />
        <div className="landing-hero__ambient-2" />
        <div className="landing-container landing-hero__container">
          <div className="landing-hero__content">
            <div className="landing-pill">
              <Sparkles size={14} className="landing-pill__icon" />
              <span>Next-Generation Academic Learning Platform</span>
            </div>

            <h1 className="landing-hero__title">
              Empower Your Intellect. <br />
              <span className="landing-hero__gradient">Master Any Discipline.</span>
            </h1>

            <p className="landing-hero__sub">
              An institutional-grade learning ecosystem connecting curious students with world-class
              instructors. Interactive modules, timed evaluations, rigorous grading rubrics, and
              cryptographically verifiable digital credentials.
            </p>

            <div className="landing-hero__cta-group">
              {user ? (
                <Link to="/dashboard" className="btn btn--gold btn--lg landing-hero__primary-btn">
                  <span>Open Your Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/register" className="btn btn--gold btn--lg landing-hero__primary-btn">
                  <span>Start Learning for Free</span>
                  <ArrowRight size={18} />
                </Link>
              )}
              <a href="#courses" className="btn btn--ghost btn--lg landing-hero__secondary-btn">
                <span>Explore Curriculum</span>
                <ChevronRight size={16} />
              </a>
            </div>

            <div className="landing-trust-strip">
              <div className="landing-trust-item">
                <span className="landing-trust-num">15,000+</span>
                <span className="landing-trust-label">Active Scholars</span>
              </div>
              <div className="landing-trust-divider" />
              <div className="landing-trust-item">
                <span className="landing-trust-num">450+</span>
                <span className="landing-trust-label">Certified Courses</span>
              </div>
              <div className="landing-trust-divider" />
              <div className="landing-trust-item">
                <span className="landing-trust-num">99.4%</span>
                <span className="landing-trust-label">Satisfaction Rate</span>
              </div>
              <div className="landing-trust-divider" />
              <div className="landing-trust-item">
                <span className="landing-trust-num">100%</span>
                <span className="landing-trust-label">Verifiable Certificates</span>
              </div>
            </div>
          </div>

          {/* Interactive Glassmorphism Preview */}
          <div className="landing-hero__visual">
            <div className="landing-preview-card">
              <div className="landing-preview-card__header">
                <div className="landing-preview-card__dots">
                  <span className="preview-dot preview-dot--red" />
                  <span className="preview-dot preview-dot--yellow" />
                  <span className="preview-dot preview-dot--green" />
                </div>
                <div className="landing-preview-card__tab">
                  <BookOpen size={13} />
                  <span>LearnFlow Student Portal • Live Session</span>
                </div>
              </div>

              <div className="landing-preview-card__body">
                <div className="preview-course-banner">
                  <div className="preview-course-badge">
                    <Zap size={13} /> Active Course
                  </div>
                  <h3>Advanced Distributed Systems</h3>
                  <div className="preview-progress-label">
                    <span>Module 4 of 6: Raft Consensus</span>
                    <strong>78% Complete</strong>
                  </div>
                  <div className="preview-progress-bar">
                    <div className="preview-progress-fill" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="preview-grid">
                  <div className="preview-metric">
                    <div className="preview-metric__icon preview-metric__icon--gold">
                      <Award size={18} />
                    </div>
                    <div>
                      <span className="preview-metric__val">3.92</span>
                      <span className="preview-metric__lbl">Cumulative GPA</span>
                    </div>
                  </div>
                  <div className="preview-metric">
                    <div className="preview-metric__icon preview-metric__icon--teal">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="preview-metric__val">14h 20m</span>
                      <span className="preview-metric__lbl">Weekly Study Time</span>
                    </div>
                  </div>
                  <div className="preview-metric">
                    <div className="preview-metric__icon preview-metric__icon--navy">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="preview-metric__val">12 / 12</span>
                      <span className="preview-metric__lbl">Quizzes Cleared</span>
                    </div>
                  </div>
                </div>

                <div className="preview-next-item">
                  <div className="preview-next-icon">
                    <Play size={15} />
                  </div>
                  <div className="preview-next-text">
                    <span className="preview-next-title">Up Next: Byzantine Fault Tolerance Lab</span>
                    <span className="preview-next-sub">Interactive Simulator • 25 Minutes</span>
                  </div>
                  <button
                    type="button"
                    className="preview-next-btn"
                    onClick={() => navigate(user ? '/my-courses' : '/login')}
                  >
                    Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Platform Pillars Section ---------- */}
      <section id="features" className="landing-section landing-section--features">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="eyebrow">Pillars of Excellence</span>
            <h2>Architected for Higher Learning</h2>
            <p>Every tool, rubric, and workflow is crafted to remove friction and accelerate mastery.</p>
          </div>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="feature-icon feature-icon--gold">
                <BookOpen size={24} />
              </div>
              <h3>Immersive Course Player</h3>
              <p>
                Seamless video streaming, structured multi-module chapters, synchronized lecture notes, and downloadable project materials.
              </p>
              <ul className="feature-sublist">
                <li>Auto-bookmarking progress</li>
                <li>Offline resource downloads</li>
                <li>Module-by-module navigation</li>
              </ul>
            </div>

            <div className="landing-feature-card">
              <div className="feature-icon feature-icon--teal">
                <Clock size={24} />
              </div>
              <h3>Timed Assessment Engine</h3>
              <p>
                Real-time countdown timer, question randomized banks, automated grading, and comprehensive rationale for every solution.
              </p>
              <ul className="feature-sublist">
                <li>Instant score calculation</li>
                <li>Detailed answer review</li>
                <li>Attempt limits & historical log</li>
              </ul>
            </div>

            <div className="landing-feature-card">
              <div className="feature-icon feature-icon--navy">
                <FileText size={24} />
              </div>
              <h3>Rigorous Grading Console</h3>
              <p>
                Instructors evaluate student deliverables with custom scoring rubrics, direct contextual remarks, and resubmission requests.
              </p>
              <ul className="feature-sublist">
                <li>Rubric-based point scoring</li>
                <li>Feedback comments per submission</li>
                <li>Pass / Fail & GPA normalization</li>
              </ul>
            </div>

            <div className="landing-feature-card">
              <div className="feature-icon feature-icon--gold">
                <ShieldCheck size={24} />
              </div>
              <h3>Verifiable Digital Credentials</h3>
              <p>
                Graduates receive tamper-proof digital certificates stamped with cryptographic serials, verifiable by any employer globally.
              </p>
              <ul className="feature-sublist">
                <li>Unique public verification URL</li>
                <li>Institutional authenticity seal</li>
                <li>Exportable PDF credentials</li>
              </ul>
            </div>

            <div className="landing-feature-card">
              <div className="feature-icon feature-icon--teal">
                <BarChart3 size={24} />
              </div>
              <h3>Actionable Cohort Telemetry</h3>
              <p>
                Deep-dive analytics tracking grade distribution, quiz question difficulty trends, engagement pacing, and at-risk students.
              </p>
              <ul className="feature-sublist">
                <li>Visual completion percentages</li>
                <li>Cohort score distribution curves</li>
                <li>Exportable attendance rosters</li>
              </ul>
            </div>

            <div className="landing-feature-card">
              <div className="feature-icon feature-icon--navy">
                <Shield size={24} />
              </div>
              <h3>Enterprise Security & RBAC</h3>
              <p>
                Strict role-based segregation protecting exam confidentiality, institutional student records, and intellectual property.
              </p>
              <ul className="feature-sublist">
                <li>Zero-trust token authentication</li>
                <li>Encrypted storage & uploads</li>
                <li>Audited administrative actions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Role Solutions Explorer ---------- */}
      <section id="roles" className="landing-section landing-section--roles">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="eyebrow">Tailored Solutions</span>
            <h2>One Unified Platform. Three Specialized Experiences.</h2>
            <p>Select your persona to discover how LearnFlow accelerates your day-to-day workflow.</p>
          </div>

          <div className="role-switcher">
            <button
              type="button"
              className={`role-switcher__btn${activeRole === 'STUDENT' ? ' is-active' : ''}`}
              onClick={() => setActiveRole('STUDENT')}
            >
              <GraduationCap size={18} />
              <span>For Students</span>
            </button>
            <button
              type="button"
              className={`role-switcher__btn${activeRole === 'INSTRUCTOR' ? ' is-active' : ''}`}
              onClick={() => setActiveRole('INSTRUCTOR')}
            >
              <BookOpen size={18} />
              <span>For Instructors</span>
            </button>
            <button
              type="button"
              className={`role-switcher__btn${activeRole === 'ADMIN' ? ' is-active' : ''}`}
              onClick={() => setActiveRole('ADMIN')}
            >
              <ShieldCheck size={18} />
              <span>For Administrators</span>
            </button>
          </div>

          <div className="role-showcase-card">
            <div className="role-showcase-content">
              <span className="role-showcase-stat-badge">
                <Sparkles size={13} /> {ROLE_PERKS[activeRole].stat}
              </span>
              <h3>{ROLE_PERKS[activeRole].title}</h3>
              <p className="role-showcase-tagline">{ROLE_PERKS[activeRole].tagline}</p>

              <div className="role-showcase-bullets">
                {ROLE_PERKS[activeRole].bullets.map((b, i) => (
                  <div key={i} className="role-bullet-item">
                    <span className="role-bullet-check"><Check size={14} /></span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="role-showcase-action">
                <Link to={ROLE_PERKS[activeRole].ctaLink} className="btn btn--accent btn--lg">
                  <span>{ROLE_PERKS[activeRole].ctaText}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="role-showcase-visual">
              <div className="role-metric-tile">
                <div className="role-metric-tile__head">
                  <div className="role-metric-tile__badge">
                    {activeRole === 'STUDENT' ? 'Learning Momentum' : activeRole === 'INSTRUCTOR' ? 'Course Evaluation' : 'Governance & Uptime'}
                  </div>
                  <span className="role-metric-tile__tag">Active</span>
                </div>
                <div className="role-metric-tile__numbers">
                  <strong>{activeRole === 'STUDENT' ? '4 Courses Active' : activeRole === 'INSTRUCTOR' ? '142 Submissions Graded' : '3,480 Managed Accounts'}</strong>
                  <span>{activeRole === 'STUDENT' ? 'Current Semester Pace: 94%' : activeRole === 'INSTRUCTOR' ? 'Average turnaround: 18 hrs' : 'Platform Health: 100%'}</span>
                </div>
                <div className="role-visual-mock">
                  <div className="mock-bar" style={{ width: '85%' }} />
                  <div className="mock-bar" style={{ width: '62%' }} />
                  <div className="mock-bar" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Featured Courses Catalog ---------- */}
      <section id="courses" className="landing-section landing-section--courses">
        <div className="landing-container">
          <div className="landing-section-header landing-section-header--split">
            <div>
              <span className="eyebrow">Academic Curriculum</span>
              <h2>Explore Premier Courses</h2>
              <p>Industry-aligned syllabi vetted by academic peers and engineering leaders.</p>
            </div>

            <div className="course-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search courses, topics, or faculty…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="landing-courses-grid">
            {filteredCourses.map((c) => (
              <div key={c.id} className="landing-course-card">
                <div className="course-card-top">
                  <span className="course-category-tag">{c.category}</span>
                  <span className="course-badge-pill">{c.badge}</span>
                </div>

                <h3 className="course-card-title">{c.title}</h3>
                <p className="course-card-desc">{c.desc}</p>

                <div className="course-card-meta">
                  <span className="course-meta-item">
                    <Clock size={13} /> {c.duration}
                  </span>
                  <span className="course-meta-item">
                    <BookOpen size={13} /> {c.modulesCount} Modules
                  </span>
                  <span className="course-meta-item">
                    <Award size={13} /> {c.level}
                  </span>
                </div>

                <div className="course-card-footer">
                  <div className="course-instructor">
                    <span className="course-instructor-avatar">
                      {c.instructor.charAt(0)}
                    </span>
                    <div className="course-instructor-info">
                      <span className="course-instructor-name">{c.instructor}</span>
                      <div className="course-rating">
                        <Star size={12} fill="#C9962F" color="#C9962F" />
                        <span>{c.rating} ({c.reviews})</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="course-enroll-btn"
                    onClick={() => navigate(user ? `/courses/${c.id}` : '/login')}
                  >
                    <span>{user ? 'View Course' : 'Enroll Now'}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="course-empty-state">
              <p>No courses match your search criteria. Try a different term or browse our standard catalog.</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSearchQuery('')}>
                Reset Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Public Certificate Verification Banner ---------- */}
      <section className="landing-section landing-section--verify">
        <div className="landing-container">
          <div className="verify-banner-card">
            <div className="verify-banner-content">
              <div className="verify-badge">
                <ShieldCheck size={16} /> Instant Credential Authentication
              </div>
              <h2>Trust, Backed by Immutable Verification</h2>
              <p>
                Every certificate issued on LearnFlow contains an authenticated serial identifier.
                Employers, registrars, and recruiters can verify candidate credentials in real-time
                without requiring platform login credentials.
              </p>
              <div className="verify-banner-actions">
                <Link to="/verify-certificate" className="btn btn--gold btn--lg">
                  <ShieldCheck size={18} />
                  <span>Open Certificate Verifier</span>
                </Link>
                <span className="verify-banner-sub">
                  Free public utility • No authentication required
                </span>
              </div>
            </div>

            <div className="verify-banner-illustration">
              <div className="sample-cert-stub">
                <div className="cert-stub-badge">
                  <GraduationCap size={20} />
                </div>
                <h4>Certificate of Mastery</h4>
                <p>Awarded for academic excellence in Distributed Systems & AI</p>
                <div className="cert-stub-code">
                  <span>SERIAL:</span>
                  <code>LF-2026-CS-9841A</code>
                </div>
                <div className="cert-stub-status">
                  <CheckCircle2 size={14} /> Verified Authentic & Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Testimonials / Social Proof ---------- */}
      <section className="landing-section landing-section--social">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="eyebrow">Academic Endorsements</span>
            <h2>Proven by Leading Scholars & Institutions</h2>
            <p>Here is what instructors and students share about their LearnFlow experience.</p>
          </div>

          <div className="landing-testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#C9962F" color="#C9962F" />
                ))}
              </div>
              <p className="testimonial-quote">
                "LearnFlow's timed assessment engine and rubric-based grading reduced our grading latency by 70%. The interface feels like a modern academic institution rather than cluttered software."
              </p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">DP</span>
                <div>
                  <strong>Dr. Patricia Wright</strong>
                  <span>Head of Computer Science, State Polytechnic</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#C9962F" color="#C9962F" />
                ))}
              </div>
              <p className="testimonial-quote">
                "As a graduate student, the course player and structured modules kept me accountable. Having a publicly verifiable certificate link helped me land my current role as a Systems Engineer."
              </p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">AK</span>
                <div>
                  <strong>Alexander Kim</strong>
                  <span>Systems Engineer & LearnFlow Alumnus</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#C9962F" color="#C9962F" />
                ))}
              </div>
              <p className="testimonial-quote">
                "The granular role permissions and automated enrollment workflows let our department run multiple simultaneous courses with zero administrative friction. Truly exceptional."
              </p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">JL</span>
                <div>
                  <strong>Prof. Jonathan Lee</strong>
                  <span>Director of Academic Technology</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Final Call to Action ---------- */}
      <section className="landing-cta-banner">
        <div className="landing-container">
          <div className="landing-cta-card">
            <h2>Ready to Elevate Your Academic Journey?</h2>
            <p>
              Join thousands of scholars and world-class instructors already building on LearnFlow today.
            </p>
            <div className="landing-cta-actions">
              {user ? (
                <Link to="/dashboard" className="btn btn--gold btn--lg">
                  <span>Go to Your Portal</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn--gold btn--lg">
                    <span>Create Free Account</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn--ghost btn--lg landing-cta-ghost">
                    <span>Sign In to Existing Portal</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Executive Footer ---------- */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer__top">
            <div className="landing-footer__brand">
              <div className="landing-brand">
                <span className="landing-brand__mark">
                  <GraduationCap size={20} />
                </span>
                <span className="landing-brand__text">
                  <span className="landing-brand__title">LearnFlow</span>
                  <span className="landing-brand__tag">Academic Suite</span>
                </span>
              </div>
              <p className="landing-footer__desc">
                An institutional-grade learning management system engineered for clarity,
                rigorous evaluations, and verifiable academic excellence.
              </p>
              <div className="landing-footer__status">
                <span className="status-indicator-dot" />
                <span>All Academic Systems Operational</span>
              </div>
            </div>

            <div className="landing-footer__links-group">
              <div className="landing-footer__col">
                <h5>Platform</h5>
                <a href="#features">Features</a>
                <a href="#courses">Curriculum</a>
                <a href="#roles">Solutions</a>
                <Link to="/verify-certificate">Certificate Verifier</Link>
              </div>

              <div className="landing-footer__col">
                <h5>Access</h5>
                <Link to="/login">Sign In</Link>
                <Link to="/register">Create Account</Link>
                <Link to="/dashboard">Dashboard</Link>
              </div>

              <div className="landing-footer__col">
                <h5>Security & Trust</h5>
                <Link to="/verify-certificate">Credential Verification</Link>
                <a href="#roles">Role Governance</a>
                <span>Strict RBAC Security</span>
              </div>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p>© {new Date().getFullYear()} LearnFlow Learning Technologies. All rights reserved.</p>
            <div className="landing-footer__legal">
              <span>Academic Integrity Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Privacy Governance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
