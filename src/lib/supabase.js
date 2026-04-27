import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co')
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
    options: { data: { username } },
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
