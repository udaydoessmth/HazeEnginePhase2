import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signUp, isSupabaseConfigured } from '../lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isSubmitting = useRef(false)
  const { localLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Strict request lock to prevent duplicate calls from double-clicks or re-renders
    if (isSubmitting.current) return
    
    console.count("signup called")
    
    isSubmitting.current = true
    setError('')
    setLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const { error: err } = await signUp(email, password, username)
        if (err) {
          setError(err.message)
          return
        }
      } else {
        localLogin(email, username)
      }
      navigate('/dashboard')
    } finally {
      isSubmitting.current = false
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg pt-14 flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-8">
          <h1 className="font-sans text-2xl font-400 mb-2">Sign up</h1>
          <p className="font-mono text-xs text-text-muted">
            Create your HazeEngine account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="font-mono text-xs text-error border border-error/20 bg-error/5 px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block font-mono text-xs text-text-secondary mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your-username"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono text-xs px-6 py-3 bg-text text-bg hover:bg-text-secondary transition-colors tracking-wider disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 font-mono text-xs text-text-muted text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-text hover:text-text-secondary underline">
            Log in
          </Link>
        </p>

        {!isSupabaseConfigured() && (
          <p className="mt-4 font-mono text-xs text-text-dim text-center border border-border px-4 py-3">
            Running in local mode — accounts are stored in your browser.
          </p>
        )}
      </div>
    </div>
  )
}
