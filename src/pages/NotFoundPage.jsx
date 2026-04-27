import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg pt-14 flex items-center justify-center px-6">
      <div className="text-center animate-fade-in-up">
        <div className="font-mono text-6xl text-text-dim mb-4">404</div>
        <h1 className="font-sans text-xl font-400 mb-2">Page not found</h1>
        <p className="font-mono text-xs text-text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="font-mono text-xs px-6 py-3 bg-text text-bg hover:bg-text-secondary transition-colors tracking-wider"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
