import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Unhandled UI error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__box">
            <h1>Something went wrong</h1>
            <p className="muted">An unexpected error stopped this page from rendering. Reloading usually clears it.</p>
            <button type="button" className="btn btn--accent" onClick={() => window.location.reload()}>Reload the page</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
