import { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, ClipboardList, HelpCircle, BarChart3, Bell,
  Users, ShieldCheck, Award, GraduationCap, LogOut, Search,
  Flame, Sun, Moon, ArrowRight, Sparkles, CheckCircle2, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

const linkClass = ({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')

function buildNavigationSections(can, role) {
  const sections = []

  // 1. Overview section
  sections.push({
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
  })

  // 2. Role-specific core section
  if (role === 'STUDENT' || can('learn')) {
    sections.push({
      title: 'Academic Suite',
      items: [
        { to: '/my-courses', label: 'My Courses', icon: BookOpen },
        { to: '/assignments', label: 'Assignments', icon: ClipboardList },
        { to: '/quizzes', label: 'Quizzes', icon: HelpCircle },
        { to: '/analytics', label: 'Learning Analytics', icon: BarChart3 },
      ]
    })
  } else if (role === 'INSTRUCTOR' || can('instructorView')) {
    sections.push({
      title: 'Instruction & Cohorts',
      items: [
        { to: '/my-courses', label: 'Course Catalog', icon: BookOpen },
        { to: '/students', label: 'Student Roster', icon: Users },
        { to: '/grading', label: 'Grading Console', icon: ClipboardList },
        { to: '/analytics', label: 'Performance Analytics', icon: BarChart3 },
      ]
    })
  } else if (role === 'ADMIN' || can('adminPanel')) {
    sections.push({
      title: 'Governance & Operations',
      items: [
        { to: '/admin', label: 'Admin Console', icon: ShieldCheck },
        { to: '/my-courses', label: 'All Courses', icon: BookOpen },
        { to: '/grading', label: 'Grading Oversight', icon: ClipboardList },
      ]
    })
  } else {
    sections.push({
      title: 'Curriculum',
      items: [
        { to: '/my-courses', label: 'Courses', icon: BookOpen }
      ]
    })
  }

  // 3. Credentials & Utilities section
  const utilityItems = []
  if (can('certificates') || role === 'STUDENT' || role === 'INSTRUCTOR' || role === 'ADMIN') {
    utilityItems.push({ to: '/certificates', label: 'Certificates', icon: Award })
  }
  utilityItems.push({ to: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'unread' })

  sections.push({
    title: 'Tools & Verification',
    items: utilityItems
  })

  return sections
}

export default function Sidebar({ open, onNavigate, unread, theme, onToggleTheme }) {
  const { user, can, logout } = useAuth()
  const navigate = useNavigate()
  const [filterQuery, setFilterQuery] = useState('')

  const sections = buildNavigationSections(can, user?.role)

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  // Filter items if user searches in sidebar
  const filteredSections = sections.map(sec => ({
    ...sec,
    items: sec.items.filter(item =>
      item.label.toLowerCase().includes(filterQuery.toLowerCase())
    )
  })).filter(sec => sec.items.length > 0)

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar__brand">
        <Link to="/dashboard" className="sidebar__brand-link" onClick={onNavigate}>
          <span className="sidebar__brand-mark">
            <GraduationCap size={20} />
          </span>
          <span className="sidebar__brand-text">
            <span className="sidebar__brand-title">LearnFlow</span>
            <span className="sidebar__brand-sub">
              {user?.role ? user.role.replace(/_/g, ' ') : 'Academic'} Portal
            </span>
          </span>
        </Link>
        <span className="sidebar__version-pill">v2.0</span>
      </div>

      {/* Quick Search / Filter in Sidebar */}
      <div className="sidebar__search-wrap">
        <Search size={14} className="sidebar__search-icon" />
        <input
          type="text"
          className="sidebar__search-input"
          placeholder="Filter navigation…"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
        {filterQuery && (
          <button
            type="button"
            className="sidebar__search-clear"
            onClick={() => setFilterQuery('')}
            aria-label="Clear filter"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="sidebar__scrollable">
        {filteredSections.map((sec, idx) => (
          <div key={idx} className="sidebar__section">
            <span className="sidebar__section-title">{sec.title}</span>
            <nav className="sidebar__nav" onClick={onNavigate}>
              {sec.items.map(({ to, label, icon: Icon, badgeKey }) => (
                <NavLink to={to} key={to} className={linkClass}>
                  <span className="nav-link__group">
                    <Icon size={18} className="nav-link__icon" />
                    <span className="nav-link__label">{label}</span>
                  </span>
                  {badgeKey === 'unread' && unread > 0 && (
                    <span className="badge">{unread}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="sidebar__empty-search">
            <span>No matching destinations</span>
            <button type="button" onClick={() => setFilterQuery('')}>
              Reset search
            </button>
          </div>
        )}

        {/* Working Component: Role-specific Progress/Action Widget */}
        <div className="sidebar__widget">
          {user?.role === 'STUDENT' ? (
            <div className="sidebar__progress-card">
              <div className="sidebar__progress-head">
                <span className="sidebar__streak-badge">
                  <Flame size={13} fill="#C9962F" color="#C9962F" /> 5-Day Streak
                </span>
                <span className="sidebar__progress-pct">82%</span>
              </div>
              <div className="sidebar__progress-title">Weekly Learning Goal</div>
              <div className="sidebar__progress-track">
                <div className="sidebar__progress-fill" style={{ width: '82%' }} />
              </div>
              <button
                type="button"
                className="sidebar__widget-btn"
                onClick={() => {
                  if (onNavigate) onNavigate()
                  navigate('/my-courses')
                }}
              >
                <span>Continue Course</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : user?.role === 'INSTRUCTOR' ? (
            <div className="sidebar__progress-card">
              <div className="sidebar__progress-head">
                <span className="sidebar__instructor-badge">
                  <Sparkles size={13} /> Teaching Desk
                </span>
                <span className="sidebar__progress-pct">Active</span>
              </div>
              <div className="sidebar__progress-title">Cohort Submissions Pending</div>
              <div className="sidebar__progress-meta">
                <span>Roster: <strong>48 Students</strong></span>
              </div>
              <button
                type="button"
                className="sidebar__widget-btn"
                onClick={() => {
                  if (onNavigate) onNavigate()
                  navigate('/grading')
                }}
              >
                <span>Review Submissions</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="sidebar__progress-card">
              <div className="sidebar__progress-head">
                <span className="sidebar__admin-badge">
                  <ShieldCheck size={13} /> System Active
                </span>
                <span className="sidebar__progress-pct">100%</span>
              </div>
              <div className="sidebar__progress-title">Platform Operations</div>
              <div className="sidebar__progress-meta">
                <span>Security & Roles: <strong>Healthy</strong></span>
              </div>
              <button
                type="button"
                className="sidebar__widget-btn"
                onClick={() => {
                  if (onNavigate) onNavigate()
                  navigate('/admin')
                }}
              >
                <span>Admin Console</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Working Component: Certificate Verifier Fast-Access Tile */}
        <Link
          to="/verify-certificate"
          className="sidebar__verify-card"
          onClick={onNavigate}
        >
          <div className="sidebar__verify-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="sidebar__verify-text">
            <span className="sidebar__verify-title">Verify Certificate</span>
            <span className="sidebar__verify-sub">Public ID validator</span>
          </div>
        </Link>
      </div>

      {/* Sidebar Utilities Strip (Status & Theme Toggle) */}
      <div className="sidebar__utility-strip">
        <div className="sidebar__system-status">
          <span className="sidebar__status-dot" />
          <span className="sidebar__status-text">Connected</span>
        </div>
        {onToggleTheme && (
          <button
            type="button"
            className="sidebar__theme-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="sidebar__theme-label">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        )}
      </div>

      {/* Enhanced Executive Account Card */}
      <div className="sidebar__account-wrap">
        <NavLink to="/profile" className="sidebar__account" onClick={onNavigate}>
          <div className="sidebar__avatar-wrap">
            <span className="avatar avatar--gold sidebar__avatar">
              {initials(user?.fullName)}
            </span>
            <span className="sidebar__avatar-dot" />
          </div>
          <span className="sidebar__account-meta">
            <span className="sidebar__account-name">{user?.fullName || 'User Profile'}</span>
            <span className="sidebar__role-pill">
              {user?.role ? user.role.replace(/_/g, ' ') : 'Member'}
            </span>
          </span>
        </NavLink>
        <button
          type="button"
          className="sidebar__signout"
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out of account"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
