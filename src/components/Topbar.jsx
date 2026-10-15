import { useNavigate } from 'react-router-dom'
import { Menu, Search, Sun, Moon, Bell } from 'lucide-react'

// Account switching and sign-out now live in the sidebar's bottom account
// card (a more standard place for it, matching apps like Slack/Linear),
// so the topbar stays focused on global, page-independent actions.
export default function Topbar({ onMenuClick, unread, theme, onToggleTheme }) {
  const navigate = useNavigate()

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-toggle" onClick={onMenuClick} aria-label="Toggle navigation">
        <Menu size={18} />
      </button>

      <div className="search-input-wrap">
        <Search size={15} />
        <input className="search-input" type="search" placeholder="Search courses…" disabled title="Search is not wired to a backend endpoint yet" />
      </div>

      <span className="topbar__spacer" />

      <button type="button" className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button type="button" className="icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
        <Bell size={16} />
        {unread > 0 && <span className="dot" />}
      </button>
    </header>
  )
}
