import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const generateId = () => crypto.randomUUID()

const defaultScene = (orderIndex = 0) => ({
  id: generateId(),
  title: `Scene ${orderIndex + 1}`,
  orderIndex,
  background: null,
  dialogues: [],
  characters: [],
  choices: [],
  transition: 'fade',
  audioId: null,
  variables: [],
})

const defaultDialogue = () => ({
  id: generateId(),
  characterName: '',
  text: '',
  emotion: 'neutral',
})

const defaultChoice = () => ({
  id: generateId(),
  text: '',
  targetSceneId: null,
  condition: null,
})

// ── helpers ──────────────────────────────────────────────────────────
async function apiFetch(url, options) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return { ok: false }
    return { ok: true, data: await res.json() }
  } catch { return { ok: false } }
}

async function supabaseLoadScenes(projectId) {
  const { data, error } = await supabase
    .from('scenes')
    .select('data')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) {
    console.error('[sceneStore] Supabase load error:', error.message)
    return null
  }
  return data ? (data.data || []) : []
}

async function supabaseSaveScenes(projectId, scenes) {
  const { error } = await supabase
    .from('scenes')
    .upsert({ project_id: projectId, data: scenes, updated_at: new Date().toISOString() },
             { onConflict: 'project_id' })
  if (error) console.error('[sceneStore] Supabase save error:', error.message)
  return !error
}

// ── store ─────────────────────────────────────────────────────────────
export const useSceneStore = create(
  persist(
    (set, get) => ({
      projectId: null,
      scenes: [],
      activeSceneId: null,
      selectedElementId: null,
      selectedElementType: null,
      isDirty: false,
      isLoaded: false,
      previewMode: false,
      previewSceneId: null,

      // Load scenes — checks Supabase, then Express, then localStorage
      loadProject: async (projectId) => {
        const state = get()
        if (state.projectId === projectId && state.isLoaded && state.scenes.length > 0) return

        let scenesData = null

        if (isSupabaseConfigured()) {
          scenesData = await supabaseLoadScenes(projectId)
        } else {
          const { ok, data } = await apiFetch(`/api/projects/${projectId}/scenes`)
          if (ok) scenesData = data
        }

        if (scenesData !== null) {
          if (scenesData.length > 0) {
            set({
              projectId,
              scenes: scenesData,
              activeSceneId: state.activeSceneId && scenesData.find(s => s.id === state.activeSceneId)
                ? state.activeSceneId
                : scenesData[0].id,
              isDirty: false,
              isLoaded: true,
            })
          } else {
            // No scenes yet — create first one
            const scene = defaultScene(0)
            set({ projectId, scenes: [scene], activeSceneId: scene.id, isDirty: true, isLoaded: true })
          }
        } else {
          // Network completely unavailable — try persisted local state
          if (get().scenes.length === 0 || state.projectId !== projectId) {
            const scene = defaultScene(0)
            set({ projectId, scenes: [scene], activeSceneId: scene.id, isDirty: true, isLoaded: true })
          } else {
            set({ projectId, isLoaded: true })
          }
        }
      },

      // Save scenes
      saveScenes: async () => {
        const { projectId, scenes } = get()
        if (!projectId) return false

        if (isSupabaseConfigured()) {
          const ok = await supabaseSaveScenes(projectId, scenes)
          if (ok) set({ isDirty: false })
          return ok
        }

        const { ok } = await apiFetch(`/api/projects/${projectId}/scenes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenes }),
        })
        if (ok) set({ isDirty: false })
        return ok
      },

      // Scene CRUD
      setScenes: (scenes) => set({ scenes, isDirty: false }),

      addScene: () => {
        const { scenes } = get()
        const scene = defaultScene(scenes.length)
        set({ scenes: [...scenes, scene], activeSceneId: scene.id, isDirty: true })
        return scene
      },

      removeScene: (id) => {
        const { scenes, activeSceneId } = get()
        const filtered = scenes.filter(s => s.id !== id)
        const cleaned = filtered.map(s => ({
          ...s,
          choices: s.choices.map(c => c.targetSceneId === id ? { ...c, targetSceneId: null } : c),
        }))
        set({
          scenes: cleaned,
          activeSceneId: activeSceneId === id ? (cleaned[0]?.id || null) : activeSceneId,
          isDirty: true,
        })
      },

      setActiveScene: (id) => set({ activeSceneId: id, selectedElementId: null, selectedElementType: null }),

      updateScene: (id, updates) => {
        set(s => ({
          scenes: s.scenes.map(sc => sc.id === id ? { ...sc, ...updates } : sc),
          isDirty: true,
        }))
      },

      reorderScenes: (fromIndex, toIndex) => {
        const { scenes } = get()
        const result = [...scenes]
        const [removed] = result.splice(fromIndex, 1)
        result.splice(toIndex, 0, removed)
        set({ scenes: result.map((s, i) => ({ ...s, orderIndex: i })), isDirty: true })
      },

      getActiveScene: () => {
        const { scenes, activeSceneId } = get()
        return scenes.find(s => s.id === activeSceneId) || null
      },

      // Dialogue CRUD
      addDialogue: (sceneId) => {
        const dialogue = defaultDialogue()
        set(s => ({
          scenes: s.scenes.map(sc =>
            sc.id === sceneId ? { ...sc, dialogues: [...sc.dialogues, dialogue] } : sc
          ),
          selectedElementId: dialogue.id,
          selectedElementType: 'dialogue',
          isDirty: true,
        }))
        return dialogue
      },

      updateDialogue: (sceneId, dialogueId, updates) => {
        set(s => ({
          scenes: s.scenes.map(sc =>
            sc.id === sceneId
              ? { ...sc, dialogues: sc.dialogues.map(d => d.id === dialogueId ? { ...d, ...updates } : d) }
              : sc
          ),
          isDirty: true,
        }))
      },

      removeDialogue: (sceneId, dialogueId) => {
        set(s => ({
          scenes: s.scenes.map(sc =>
            sc.id === sceneId ? { ...sc, dialogues: sc.dialogues.filter(d => d.id !== dialogueId) } : sc
          ),
          isDirty: true,
        }))
      },

      // Choice CRUD
      addChoice: (sceneId) => {
        const choice = defaultChoice()
        set(s => ({
          scenes: s.scenes.map(sc =>
            sc.id === sceneId ? { ...sc, choices: [...sc.choices, choice] } : sc
          ),
          isDirty: true,
        }))
        return choice
      },

      updateChoice: (sceneId, choiceId, updates) => {
        set(s => ({
          scenes: s.scenes.map(sc =>
            sc.id === sceneId
              ? { ...sc, choices: sc.choices.map(c => c.id === choiceId ? { ...c, ...updates } : c) }
              : sc
          ),
          isDirty: true,
        }))
      },

      removeChoice: (sceneId, choiceId) => {
        set(s => ({
          scenes: s.scenes.map(sc =>
            sc.id === sceneId ? { ...sc, choices: sc.choices.filter(c => c.id !== choiceId) } : sc
          ),
          isDirty: true,
        }))
      },

      selectElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),
      clearSelection: () => set({ selectedElementId: null, selectedElementType: null }),

      startPreview: (sceneId) => set({ previewMode: true, previewSceneId: sceneId || get().scenes[0]?.id }),
      stopPreview: () => set({ previewMode: false, previewSceneId: null }),
      setPreviewScene: (id) => set({ previewSceneId: id }),

      markClean: () => set({ isDirty: false }),

      resetForProject: (projectId) => set({
        projectId,
        scenes: [],
        activeSceneId: null,
        isDirty: false,
        isLoaded: false,
      }),
    }),
    {
      name: 'haze-scene-store',
      partialize: (state) => ({
        projectId: state.projectId,
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
        isLoaded: state.isLoaded,
      }),
    }
  )
)
