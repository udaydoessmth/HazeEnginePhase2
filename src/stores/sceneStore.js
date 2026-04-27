import { create } from 'zustand'

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
  audioTrackId: null,
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

export const useSceneStore = create((set, get) => ({
  scenes: [],
  activeSceneId: null,
  selectedElementId: null,
  selectedElementType: null, // 'dialogue' | 'choice' | 'character'
  isDirty: false,
  previewMode: false,
  previewSceneId: null,

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
    // Remove choices pointing to deleted scene
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

  // Active scene helpers
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

  // Selection
  selectElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),
  clearSelection: () => set({ selectedElementId: null, selectedElementType: null }),

  // Preview
  startPreview: (sceneId) => set({ previewMode: true, previewSceneId: sceneId || get().scenes[0]?.id }),
  stopPreview: () => set({ previewMode: false, previewSceneId: null }),
  setPreviewScene: (id) => set({ previewSceneId: id }),

  // Mark clean (after save)
  markClean: () => set({ isDirty: false }),
}))
