import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { user, localLogout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    localLogout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-mono text-sm font-bold tracking-wider text-text hover:text-text-secondary transition-colors">
          HazeEngine
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="font-mono text-xs text-text-secondary hover:text-text transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="font-mono text-xs text-text-muted hover:text-text transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-mono text-xs text-text-secondary hover:text-text transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="font-mono text-xs px-4 py-2 border border-border hover:border-border-hover bg-bg-elevated hover:bg-bg-hover transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
