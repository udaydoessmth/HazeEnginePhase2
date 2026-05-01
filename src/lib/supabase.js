import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate: URL must start with https:// and key must look like a JWT (has dots)
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project')
const isValidKey = supabaseAnonKey && supabaseAnonKey.includes('.') && supabaseAnonKey !== 'your-anon-key-here'

export const supabase = (isValidUrl && isValidKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper: check if Supabase is configured
export const isSupabaseConfigured = () => supabase !== null

// Auth helpers
export const signUp = async (email, password, username) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured. Using local mode.' } }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { username },
      emailRedirectTo: `${window.location.origin}/dashboard`
    },
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured. Using local mode.' } }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signOut = async () => {
  if (!supabase) return
  await supabase.auth.signOut()
}

export const getSession = async () => {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Debug helper — log connection status on import
if (import.meta.env.DEV) {
  console.log(
    `[Supabase] ${isSupabaseConfigured() ? '✓ Connected' : '✗ Not configured — using local mode'}`,
    isValidUrl ? `URL: ${supabaseUrl}` : 'URL: invalid',
  )
}
