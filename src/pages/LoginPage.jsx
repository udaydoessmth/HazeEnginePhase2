import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signIn, isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { localLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSupabaseConfigured()) {
      const { error: err } = await signIn(email, password)
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    } else {
      localLogin(email)
    }

    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      fontFamily: 'monospace',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .auth-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-family: monospace;
          font-size: 13px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.15s;
          letter-spacing: 0.03em;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus { border-color: rgba(255,255,255,0.35); }
        .auth-submit {
          width: 100%;
          font-family: monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 14px;
          background: #fff;
          color: #080808;
          border: none;
          cursor: pointer;
          font-weight: 700;
          transition: opacity 0.15s;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.88; }
        .auth-submit:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      {/* Left panel — decorative */}
      <div style={{
        width: '45%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Concentric circles — matches homepage motif */}
        <div style={{ position: 'relative', width: '320px', height: '320px' }}>
          {[320, 240, 170, 110, 60].map((size, i) => (
            <div key={size} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: size, height: size,
              borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${0.04 + i * 0.015})`,
              transform: 'translate(-50%, -50%)',
              background: i === 4 ? 'rgba(255,255,255,0.06)' : 'transparent',
            }} />
          ))}
          {/* Glowing core */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 18, height: 18,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 60%, transparent 100%)',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 24px 6px rgba(255,255,255,0.12)',
          }} />
        </div>

        {/* Brand label */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '48px',
          animation: 'fadeUp 0.6s ease both',
          animationDelay: '0.2s',
        }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            marginBottom: '6px',
          }}>
            ● Visual Novel Engine + DAW
          </div>
          <div style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: '22px',
            fontWeight: '900',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '-0.01em',
          }}>
            HazeEngine
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          animation: 'fadeUp 0.5s ease both',
          animationDelay: '0.1s',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '14px',
            }}>
              Welcome back
            </div>
            <h1 style={{
              fontFamily: "'Arial Black', 'Arial Bold', sans-serif",
              fontSize: '36px',
              fontWeight: '900',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}>
              Log in
            </h1>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#ff5555',
              border: '1px solid rgba(255,85,85,0.2)',
              background: 'rgba(255,85,85,0.05)',
              padding: '10px 14px',
              marginBottom: '20px',
              letterSpacing: '0.03em',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: '8px',
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="auth-input"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: '8px',
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="auth-input"
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="auth-submit"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </div>
          </div>

          {/* Footer links */}
          <div style={{
            marginTop: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
          }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              margin: 0,
              letterSpacing: '0.05em',
            }}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.3)',
                  paddingBottom: '1px',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#fff'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
              >
                Sign up
              </Link>
            </p>

            {!isSupabaseConfigured() && (
              <p style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.18)',
                margin: 0,
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '8px 14px',
                letterSpacing: '0.04em',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                Local mode — any email/password will work.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}