import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export const useSceneStore = create(
  persist(
    (set, get) => ({
      // Track which project is loaded to prevent cross-project contamination
      projectId: null,
      scenes: [],
      activeSceneId: null,
      selectedElementId: null,
      selectedElementType: null,
      isDirty: false,
      isLoaded: false,
      previewMode: false,
      previewSceneId: null,

      // Load scenes from server — only if not already loaded for this project
      loadProject: async (projectId) => {
        const state = get()
        // If already loaded for this project and we have data, don't reload
        if (state.projectId === projectId && state.isLoaded && state.scenes.length > 0) {
          return
        }

        try {
          const res = await fetch(`/api/projects/${projectId}/scenes`)
          const scenesData = await res.json()

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
            // No scenes on server — create first scene only if we don't have any
            if (state.scenes.length === 0 || state.projectId !== projectId) {
              const scene = defaultScene(0)
              set({
                projectId,
                scenes: [scene],
                activeSceneId: scene.id,
                isDirty: true,
                isLoaded: true,
              })
            } else {
              set({ projectId, isLoaded: true })
            }
          }
        } catch (err) {
          console.error('[SceneStore] Load failed:', err)
          // If we have no scenes at all, create one
          if (get().scenes.length === 0) {
            const scene = defaultScene(0)
            set({
              projectId,
              scenes: [scene],
              activeSceneId: scene.id,
              isDirty: true,
              isLoaded: true,
            })
          } else {
            set({ projectId, isLoaded: true })
          }
        }
      },

      // Save scenes to server
      saveScenes: async () => {
        const { projectId, scenes } = get()
        if (!projectId) return false
        try {
          await fetch(`/api/projects/${projectId}/scenes`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenes }),
          })
          set({ isDirty: false })
          return true
        } catch (err) {
          console.error('[SceneStore] Save failed:', err)
          return false
        }
      },

      // Scene CRUD
      setScenes: (scenes) => set({ scenes, isDirty: false }),

      addScene: () => {
        const { scenes } = get()
        const scene = defaultScene(scenes.length)
        set({
          scenes: [...scenes, scene],
          activeSceneId: scene.id,
          isDirty: true,
        })
        return scene
      },

      removeScene: (id) => {
        const { scenes, activeSceneId } = get()
        const filtered = scenes.filter(s => s.id !== id)
        const cleaned = filtered.map(s => ({
          ...s,
          choices: s.choices.map(c =>
            c.targetSceneId === id ? { ...c, targetSceneId: null } : c
          ),
        }))
        set({
          scenes: cleaned,
          activeSceneId: activeSceneId === id ? (cleaned[0]?.id || null) : activeSceneId,
          isDirty: true,
        })
      },

      setActiveScene: (id) => set({ activeSceneId: id, selectedElementId: null, selectedElementType: null }),

      updateScene: (id, updates) => {
        const { scenes } = get()
        set({
          scenes: scenes.map(s => s.id === id ? { ...s, ...updates } : s),
          isDirty: true,
        })
      },

      reorderScenes: (fromIndex, toIndex) => {
        const { scenes } = get()
        const result = [...scenes]
        const [removed] = result.splice(fromIndex, 1)
        result.splice(toIndex, 0, removed)
        set({
          scenes: result.map((s, i) => ({ ...s, orderIndex: i })),
          isDirty: true,
        })
      },

      getActiveScene: () => {
        const { scenes, activeSceneId } = get()
        return scenes.find(s => s.id === activeSceneId) || null
      },

      // Dialogue CRUD
      addDialogue: (sceneId) => {
        const dialogue = defaultDialogue()
        const { scenes } = get()
        set({
          scenes: scenes.map(s =>
            s.id === sceneId
              ? { ...s, dialogues: [...s.dialogues, dialogue] }
              : s
          ),
          selectedElementId: dialogue.id,
          selectedElementType: 'dialogue',
          isDirty: true,
        })
        return dialogue
      },

      updateDialogue: (sceneId, dialogueId, updates) => {
        const { scenes } = get()
        set({
          scenes: scenes.map(s =>
            s.id === sceneId
              ? {
                  ...s,
                  dialogues: s.dialogues.map(d =>
                    d.id === dialogueId ? { ...d, ...updates } : d
                  ),
                }
              : s
          ),
          isDirty: true,
        })
      },

      removeDialogue: (sceneId, dialogueId) => {
        const { scenes } = get()
        set({
          scenes: scenes.map(s =>
            s.id === sceneId
              ? { ...s, dialogues: s.dialogues.filter(d => d.id !== dialogueId) }
              : s
          ),
          isDirty: true,
        })
      },

      // Choice CRUD
      addChoice: (sceneId) => {
        const choice = defaultChoice()
        const { scenes } = get()
        set({
          scenes: scenes.map(s =>
            s.id === sceneId
              ? { ...s, choices: [...s.choices, choice] }
              : s
          ),
          isDirty: true,
        })
        return choice
      },

      updateChoice: (sceneId, choiceId, updates) => {
        const { scenes } = get()
        set({
          scenes: scenes.map(s =>
            s.id === sceneId
              ? {
                  ...s,
                  choices: s.choices.map(c =>
                    c.id === choiceId ? { ...c, ...updates } : c
                  ),
                }
              : s
          ),
          isDirty: true,
        })
      },

      removeChoice: (sceneId, choiceId) => {
        const { scenes } = get()
        set({
          scenes: scenes.map(s =>
            s.id === sceneId
              ? { ...s, choices: s.choices.filter(c => c.id !== choiceId) }
              : s
          ),
          isDirty: true,
        })
      },

      selectElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),
      clearSelection: () => set({ selectedElementId: null, selectedElementType: null }),

      startPreview: (sceneId) => set({ previewMode: true, previewSceneId: sceneId || get().scenes[0]?.id }),
      stopPreview: () => set({ previewMode: false, previewSceneId: null }),
      setPreviewScene: (id) => set({ previewSceneId: id }),

      markClean: () => set({ isDirty: false }),

      // Reset for a new project
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
      // Only persist essential data, not UI state
      partialize: (state) => ({
        projectId: state.projectId,
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
        isLoaded: state.isLoaded,
      }),
    }
  )
)
