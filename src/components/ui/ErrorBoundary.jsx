import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="font-mono text-sm text-text-secondary mb-4">Something went wrong</h1>
            <p className="font-mono text-xs text-text-muted mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="font-mono text-xs px-5 py-2 border border-border hover:border-border-hover transition-colors"
              >
                Try again
              </button>
              <a
                href="/"
                className="font-mono text-xs px-5 py-2 bg-text text-bg hover:bg-text-secondary transition-colors"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
