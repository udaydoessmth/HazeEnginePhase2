import { create } from 'zustand'

export const useProjectStore = create((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      set({ projects: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createProject: async (title, description = '') => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const project = await res.json()
      set(s => ({ projects: [...s.projects, project] }))
      return project
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  updateProject: async (id, updates) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const updated = await res.json()
      set(s => ({
        projects: s.projects.map(p => p.id === id ? updated : p),
      }))
      return updated
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  deleteProject: async (id) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },
}))
