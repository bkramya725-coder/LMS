import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// React Router's client-side navigation never triggers a real page load,
// so the browser has no reason to reset scroll position the way it would
// for a normal <a> navigation — the page you land on keeps whatever
// scroll offset the *previous* page was at. On a long page (e.g. a course
// catalog) followed by Back to a shorter one, this can make it look like
// "the page didn't change": the URL updates, but you're still scrolled
// down past all its content.
//
// We also disable the browser's own scroll restoration, because for a
// dynamically-rendered SPA it frequently restores the wrong offset (the
// page's height when React re-renders often isn't the same as when the
// browser snapshotted the scroll position).
export default function ScrollToTop() {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
    const mainContent = document.querySelector('.content')
    if (mainContent) mainContent.scrollTop = 0
  }, [pathname, search, navigationType])

  return null
}
