import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Local mode — check localStorage for mock user
      const stored = localStorage.getItem('haze_user')
      if (stored) setUser(JSON.parse(stored))
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Local mode auth
  const localLogin = (email, username) => {
    const mockUser = { id: crypto.randomUUID(), email, username: username || email.split('@')[0] }
    localStorage.setItem('haze_user', JSON.stringify(mockUser))
    setUser(mockUser)
    return mockUser
  }

  const localLogout = () => {
    localStorage.removeItem('haze_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, localLogin, localLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
