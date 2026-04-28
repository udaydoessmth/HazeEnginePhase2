import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function LogoMark({ size = 24 }) {
  return (
    <span
      style={{
        fontFamily: '"Symbol Craze", serif',
        fontSize: `${size}px`,
        lineHeight: 1,
        display: 'inline-block',
      }}
      aria-hidden="true"
    >
      ꛅ
    </span>
  )
}

export default function Navbar() {
  const { user, localLogout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    localLogout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-bg/80 backdrop-blur-xl transition-all">
      <div
        className="h-20 flex items-center justify-between"
        style={{
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
        }}
      >
        {/* Logo + wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <LogoMark size={26} />
          <span className="font-sans text-xl font-bold tracking-tight text-text">
            HazeEngine
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-8">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="font-mono text-sm text-text-secondary hover:text-text transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="font-mono text-sm text-text-muted hover:text-text transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-mono text-sm text-text-secondary hover:text-text transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="font-mono text-sm px-6 py-2.5 rounded-full border border-border/50 bg-bg-elevated hover:bg-bg-hover hover:border-border transition-all"
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