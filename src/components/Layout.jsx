import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { notificationsApi } from '../api/misc'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [theme, setTheme] = useState(() => localStorage.getItem('lms_theme') || 'light')
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('lms_theme', theme)
  }, [theme])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const items = await notificationsApi.mine()
        if (active) setUnread(items.filter((n) => !n.read).length)
      } catch {
        // A missing badge count should never block the page.
      }
    }
    load()
    const timer = setInterval(load, 60000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [location.pathname])

  return (
    <div className="app-shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <Sidebar
        open={open}
        onNavigate={() => setOpen(false)}
        unread={unread}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenuClick={() => setOpen((v) => !v)} unread={unread} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
