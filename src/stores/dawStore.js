import { create } from 'zustand'

// Scale notes for different keys/scales
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const DRUM_ROWS = ['kick', 'snare', 'hihat', 'rimshot']
const STEPS = 16
const OCTAVE_RANGE = [3, 4, 5] // 3 octaves

// Generate pitch rows for melodic channels
function generatePitchRows(scale = 'major', rootNote = 'C') {
  const rootIndex = NOTES.indexOf(rootNote)
  const intervals = SCALES[scale] || SCALES.major
  const rows = []
  for (const octave of [...OCTAVE_RANGE].reverse()) {
    for (const interval of [...intervals].reverse()) {
      const noteIndex = (rootIndex + interval) % 12
      rows.push(`${NOTES[noteIndex]}${octave}`)
    }
  }
  return rows
}

// Create empty pattern
function createEmptyPattern(channelType, scale, rootNote) {
  const rows = channelType === 'drums' ? DRUM_ROWS : generatePitchRows(scale, rootNote)
  const grid = {}
  rows.forEach(row => {
    grid[row] = new Array(STEPS).fill(false)
  })
  return { grid, rows }
}

const DEFAULT_CHANNELS = ['lead', 'bass', 'extra', 'drums']
const DEFAULT_INSTRUMENTS = {
  lead: 'synth',
  bass: 'fmSynth',
  extra: 'polySynth',
  drums: 'drums',
}

export const useDawStore = create((set, get) => ({
  // Track metadata
  trackId: null,
  trackTitle: 'Untitled Track',
  projectId: null,

  // Transport
  isPlaying: false,
  tempo: 120,
  currentStep: -1,
  isLooping: true,
  volume: 0.8,

  // Scale settings
  scale: 'major',
  rootNote: 'C',

  // Channels
  channels: DEFAULT_CHANNELS,
  activeChannel: 'lead',
  instruments: { ...DEFAULT_INSTRUMENTS },

  // Patterns - one pattern per channel
  patterns: {},
  
  // UI state
  isDirty: false,

  // Initialize patterns
  initPatterns: () => {
    const { scale, rootNote } = get()
    const patterns = {}
    DEFAULT_CHANNELS.forEach(ch => {
      const type = ch === 'drums' ? 'drums' : 'melodic'
      patterns[ch] = createEmptyPattern(type, scale, rootNote)
    })
    set({ patterns })
  },

  // Channel
  setActiveChannel: (ch) => set({ activeChannel: ch }),

  // Transport
  setIsPlaying: (v) => set({ isPlaying: v }),
  setTempo: (t) => set({ tempo: Math.max(40, Math.min(300, t)), isDirty: true }),
  setCurrentStep: (s) => set({ currentStep: s }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  toggleLoop: () => set(s => ({ isLooping: !s.isLooping })),

  // Scale
  setScale: (scale) => {
    set({ scale, isDirty: true })
    // Rebuild melodic channel patterns
    const { patterns, rootNote } = get()
    const updated = { ...patterns }
    DEFAULT_CHANNELS.forEach(ch => {
      if (ch !== 'drums') {
        updated[ch] = createEmptyPattern('melodic', scale, rootNote)
      }
    })
    set({ patterns: updated })
  },

  setRootNote: (rootNote) => {
    set({ rootNote, isDirty: true })
    const { patterns, scale } = get()
    const updated = { ...patterns }
    DEFAULT_CHANNELS.forEach(ch => {
      if (ch !== 'drums') {
        updated[ch] = createEmptyPattern('melodic', scale, rootNote)
      }
    })
    set({ patterns: updated })
  },

  // Instrument
  setInstrument: (channel, instrument) => {
    set(s => ({
      instruments: { ...s.instruments, [channel]: instrument },
      isDirty: true,
    }))
  },

  // Note toggling
  toggleNote: (channel, row, step) => {
    const { patterns } = get()
    const pattern = patterns[channel]
    if (!pattern || !pattern.grid[row]) return

    const newGrid = { ...pattern.grid }
    newGrid[row] = [...newGrid[row]]
    newGrid[row][step] = !newGrid[row][step]

    set({
      patterns: {
        ...patterns,
        [channel]: { ...pattern, grid: newGrid },
      },
      isDirty: true,
    })
  },

  // Clear pattern
  clearPattern: (channel) => {
    const { patterns, scale, rootNote } = get()
    const type = channel === 'drums' ? 'drums' : 'melodic'
    set({
      patterns: {
        ...patterns,
        [channel]: createEmptyPattern(type, scale, rootNote),
      },
      isDirty: true,
    })
  },

  // Clear all
  clearAll: () => {
    get().initPatterns()
    set({ isDirty: true })
  },

  // Load track data
  loadTrack: (track) => {
    if (!track) return
    set({
      trackId: track.id,
      trackTitle: track.title || 'Untitled Track',
      projectId: track.projectId,
      tempo: track.tempo || 120,
      scale: track.scale || 'major',
      rootNote: track.rootNote || 'C',
      instruments: track.instruments || { ...DEFAULT_INSTRUMENTS },
      isDirty: false,
    })

    // Load patterns or init fresh
    if (track.patternData && Object.keys(track.patternData).length > 0) {
      set({ patterns: track.patternData })
    } else {
      get().initPatterns()
    }
  },

  // Export state for saving
  getTrackData: () => {
    const s = get()
    return {
      id: s.trackId,
      title: s.trackTitle,
      projectId: s.projectId,
      tempo: s.tempo,
      scale: s.scale,
      rootNote: s.rootNote,
      instruments: s.instruments,
      patternData: s.patterns,
    }
  },

  setTrackTitle: (title) => set({ trackTitle: title, isDirty: true }),
  setTrackId: (id) => set({ trackId: id }),
  setProjectId: (id) => set({ projectId: id }),
  markClean: () => set({ isDirty: false }),
}))

export { SCALES, NOTES, DRUM_ROWS, STEPS, OCTAVE_RANGE, generatePitchRows }
