import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ── Local (localStorage) fallback ────────────────────────────────
const STORAGE_KEY = 'haze_projects'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveLocal(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

// ── helpers ──────────────────────────────────────────────────────
async function apiFetch(url, options) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return { ok: false }
    return { ok: true, data: await res.json() }
  } catch { return { ok: false } }
}

// Normalise Supabase snake_case → camelCase for the rest of the app
function fromSupabase(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── store ─────────────────────────────────────────────────────────
export const useProjectStore = create((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchProjects: async () => {
    set({ loading: true, error: null })

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('[projectStore] Supabase fetch error:', error.message)
        set({ projects: loadLocal(), loading: false, error: error.message })
      } else {
        const projects = (data || []).map(fromSupabase)
        set({ projects, loading: false })
        saveLocal(projects)
      }
      return
    }

    // Supabase not configured → try Express server → localStorage
    const { ok, data } = await apiFetch('/api/projects')
    if (ok) {
      set({ projects: data, loading: false })
      saveLocal(data)
    } else {
      set({ projects: loadLocal(), loading: false })
    }
  },

  createProject: async (title, description = '') => {
    try {
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { set({ error: 'Not authenticated' }); return null }

        const { data, error } = await supabase
          .from('projects')
          .insert({ title, description, user_id: user.id })
          .select()
          .single()

        if (error) { set({ error: error.message }); return null }
        const project = fromSupabase(data)
        set(s => ({ projects: [project, ...s.projects] }))
        saveLocal(get().projects)
        return project
      }

      // Express server fallback
      const { ok, data } = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (ok) {
        set(s => ({ projects: [data, ...s.projects] }))
        saveLocal(get().projects)
        return data
      }

      // localStorage fallback
      const project = {
        id: crypto.randomUUID(), title, description,
        userId: 'local', isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set(s => ({ projects: [project, ...s.projects] }))
      saveLocal(get().projects)
      return project
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  updateProject: async (id, updates) => {
    try {
      if (isSupabaseConfigured()) {
        // Convert camelCase updates → snake_case for Supabase
        const patch = {}
        if (updates.title !== undefined)       patch.title        = updates.title
        if (updates.description !== undefined) patch.description  = updates.description
        if (updates.isPublished !== undefined) patch.is_published = updates.isPublished
        if (updates.publishedAt !== undefined) patch.published_at = updates.publishedAt
        patch.updated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('projects')
          .update(patch)
          .eq('id', id)
          .select()
          .single()

        if (error) { set({ error: error.message }); return null }
        const project = fromSupabase(data)
        set(s => ({ projects: s.projects.map(p => p.id === id ? project : p) }))
        saveLocal(get().projects)
        return project
      }

      // Express fallback
      const { ok, data } = await apiFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (ok) {
        set(s => ({ projects: s.projects.map(p => p.id === id ? data : p) }))
        saveLocal(get().projects)
        return data
      }

      // localStorage fallback
      const now = new Date().toISOString()
      set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p) }))
      saveLocal(get().projects)
      return get().projects.find(p => p.id === id)
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  deleteProject: async (id) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) { set({ error: error.message }); return false }
      } else {
        await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
      }
      set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
      saveLocal(get().projects)
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },
}))
