import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
const OCTAVE_RANGE = [3, 4, 5]

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

function buildFreshPatterns(scale, rootNote) {
  const patterns = {}
  DEFAULT_CHANNELS.forEach(ch => {
    patterns[ch] = createEmptyPattern(ch === 'drums' ? 'drums' : 'melodic', scale, rootNote)
  })
  return patterns
}

export const useDawStore = create(
  persist(
    (set, get) => ({
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

      // Patterns
      patterns: {},

      // UI state
      isDirty: false,

      // Initialize patterns — always builds fresh, never uses persisted stale data
      initPatterns: () => {
        const { scale, rootNote } = get()
        set({ patterns: buildFreshPatterns(scale, rootNote), isDirty: false })
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
        const { patterns, rootNote } = get()
        const updated = { ...patterns }
        DEFAULT_CHANNELS.forEach(ch => {
          if (ch !== 'drums') updated[ch] = createEmptyPattern('melodic', scale, rootNote)
        })
        set({ scale, patterns: updated, isDirty: true })
      },

      setRootNote: (rootNote) => {
        const { patterns, scale } = get()
        const updated = { ...patterns }
        DEFAULT_CHANNELS.forEach(ch => {
          if (ch !== 'drums') updated[ch] = createEmptyPattern('melodic', scale, rootNote)
        })
        set({ rootNote, patterns: updated, isDirty: true })
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
          patterns: { ...patterns, [channel]: { ...pattern, grid: newGrid } },
          isDirty: true,
        })
      },

      // Clear pattern
      clearPattern: (channel) => {
        const { patterns, scale, rootNote } = get()
        set({
          patterns: {
            ...patterns,
            [channel]: createEmptyPattern(channel === 'drums' ? 'drums' : 'melodic', scale, rootNote),
          },
          isDirty: true,
        })
      },

      clearAll: () => {
        const { scale, rootNote } = get()
        set({ patterns: buildFreshPatterns(scale, rootNote), isDirty: true })
      },

      // Load track from API response
      // Handles both old field name (patternData) and new (patterns)
      loadTrack: (track) => {
        if (!track) return

        // Resolve patterns — API may have saved under either key
        const resolvedPatterns = track.patterns ?? track.patternData ?? null

        const scale = track.scale || 'major'
        const rootNote = track.rootNote || 'C'

        set({
          trackId: track.id,
          trackTitle: track.title || 'Untitled Track',
          projectId: track.projectId,
          tempo: track.tempo || 120,
          scale,
          rootNote,
          instruments: track.instruments || { ...DEFAULT_INSTRUMENTS },
          // Use resolved patterns if they exist and are non-empty,
          // otherwise build fresh so we never get stale persisted data
          patterns: (resolvedPatterns && Object.keys(resolvedPatterns).length > 0)
            ? resolvedPatterns
            : buildFreshPatterns(scale, rootNote),
          isDirty: false,
        })
      },

      // Export state for saving
      // IMPORTANT: always uses "patterns" as the canonical key going forward.
      // GamePreview already handles both: track.patterns ?? track.patternData
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
          // Save under BOTH keys so old and new consumers both work
          patterns: s.patterns,
          patternData: s.patterns,
        }
      },

      setTrackTitle: (title) => set({ trackTitle: title, isDirty: true }),
      setTrackId: (id) => set({ trackId: id }),
      setProjectId: (id) => set({ projectId: id }),
      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'haze-daw-store',
      partialize: (state) => ({
        // Persist transport/settings but NOT patterns or trackId.
        // Patterns are always loaded fresh from the API or initialized clean.
        // Persisting patterns caused stale data from a previous track to bleed
        // into a new track's save.
        tempo: state.tempo,
        scale: state.scale,
        rootNote: state.rootNote,
        instruments: state.instruments,
        volume: state.volume,
        isLooping: state.isLooping,
      }),
    }
  )
)

export { SCALES, NOTES, DRUM_ROWS, STEPS, OCTAVE_RANGE, generatePitchRows }