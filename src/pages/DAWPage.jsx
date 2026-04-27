import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDawStore, STEPS } from '../stores/dawStore'
import audioEngine from '../audio/AudioEngine'
import { exportToWav, exportAndUpload } from '../audio/exporter'
import StepSequencer from '../components/DAW/StepSequencer'
import ChannelSelector from '../components/DAW/ChannelSelector'
import TransportBar from '../components/DAW/TransportBar'
import InstrumentPanel from '../components/DAW/InstrumentPanel'

export default function DAWPage() {
  const { projectId, trackId } = useParams()
  const navigate = useNavigate()
  const [audioReady, setAudioReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const patternsRef = useRef(null)

  const {
    isPlaying, tempo, currentStep, isLooping, volume, patterns,
    activeChannel, instruments, trackTitle, isDirty, scale, rootNote,
    setIsPlaying, setCurrentStep, setTempo, toggleLoop,
    setVolume, initPatterns, loadTrack, getTrackData,
    markClean, setTrackTitle, setTrackId, setProjectId,
  } = useDawStore()

  // Keep ref in sync
  useEffect(() => {
    patternsRef.current = patterns
  }, [patterns])

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (trackId) {
        try {
          const res = await fetch(`/api/audio-tracks/${trackId}`)
          if (res.ok) {
            const track = await res.json()
            loadTrack(track)
            return
          }
        } catch { /* ignore */ }
      }
      // New track
      setProjectId(projectId)
      initPatterns()
    }
    init()

    return () => {
      audioEngine.stopPlayback()
      setIsPlaying(false)
      setCurrentStep(-1)
    }
  }, [trackId, projectId])

  // Init audio on user gesture
  const initAudio = async () => {
    await audioEngine.init()
    // Apply current instruments
    Object.entries(instruments).forEach(([ch, inst]) => {
      audioEngine.changeInstrument(ch, inst)
    })
    setAudioReady(true)
  }

  // Update patterns in engine during playback
  useEffect(() => {
    if (isPlaying && patternsRef.current) {
      audioEngine.updatePatterns(patternsRef.current)
    }
  }, [patterns, isPlaying])

  // Play/Stop
  const togglePlay = useCallback(async () => {
    if (!audioReady) await initAudio()

    if (isPlaying) {
      audioEngine.stopPlayback()
      setIsPlaying(false)
      setCurrentStep(-1)
    } else {
      audioEngine.startPlayback(
        patternsRef.current || patterns,
        tempo,
        isLooping,
        (step) => setCurrentStep(step)
      )
      setIsPlaying(true)
    }
  }, [isPlaying, tempo, isLooping, patterns, audioReady])

  // Tempo change
  useEffect(() => {
    if (isPlaying) {
      audioEngine.setTempo(tempo)
    }
  }, [tempo, isPlaying])

  // Volume change
  useEffect(() => {
    audioEngine.setVolume(volume)
  }, [volume])

  // Instrument change
  const handleInstrumentChange = (channel, instrumentId) => {
    useDawStore.getState().setInstrument(channel, instrumentId)
    if (audioReady) {
      audioEngine.changeInstrument(channel, instrumentId)
    }
  }

  // Save
  const handleSave = async () => {
    setSaving(true)
    try {
      const data = getTrackData()
      let url, method
      if (data.id) {
        url = `/api/audio-tracks/${data.id}`
        method = 'PUT'
      } else {
        url = '/api/audio-tracks'
        method = 'POST'
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const saved = await res.json()
      setTrackId(saved.id)
      markClean()
    } catch (err) {
      console.error('Save failed:', err)
    }
    setSaving(false)
  }

  // Autosave
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(handleSave, 8000)
    return () => clearTimeout(timer)
  }, [isDirty])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => projectId ? navigate(`/project/${projectId}/editor`) : navigate('/dashboard')}
            className="font-mono text-xs text-text-muted hover:text-text transition-colors"
          >
            ← Back
          </button>
          <span className="text-text-dim">|</span>
          <input
            value={trackTitle}
            onChange={e => setTrackTitle(e.target.value)}
            className="font-mono text-xs bg-transparent border-none outline-none text-text-secondary hover:text-text focus:text-text w-48"
            placeholder="Track title..."
          />
          {isDirty && <span className="font-mono text-xs text-text-dim">(unsaved)</span>}
        </div>
        <div className="flex items-center gap-3">
          {projectId && (
            <Link
              to={`/project/${projectId}/editor`}
              className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 border border-border hover:border-border-hover transition-all"
            >
              Scene Editor
            </Link>
          )}
          <button
            onClick={async () => {
              setExporting(true)
              try {
                await exportToWav(patterns, instruments, tempo)
              } catch (err) {
                console.error('Export failed:', err)
              }
              setExporting(false)
            }}
            disabled={exporting || !audioReady}
            className="font-mono text-xs px-3 py-1.5 border border-border hover:border-border-hover text-text-muted hover:text-text transition-all disabled:opacity-30"
          >
            {exporting ? 'Exporting...' : '↓ Export WAV'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="font-mono text-xs px-4 py-1.5 bg-text text-bg hover:bg-text-secondary transition-colors disabled:opacity-30"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Audio init overlay */}
      {!audioReady && (
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={initAudio}
            className="font-mono text-sm px-8 py-4 border border-border hover:border-border-hover hover:bg-bg-hover transition-all"
          >
            Click to initialize audio engine
          </button>
        </div>
      )}

      {/* DAW Content */}
      {audioReady && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Transport */}
          <TransportBar
            isPlaying={isPlaying}
            tempo={tempo}
            isLooping={isLooping}
            volume={volume}
            scale={scale}
            rootNote={rootNote}
            onTogglePlay={togglePlay}
            onTempoChange={setTempo}
            onToggleLoop={toggleLoop}
            onVolumeChange={setVolume}
          />

          {/* Channel Selector */}
          <ChannelSelector activeChannel={activeChannel} />

          {/* Instrument Panel */}
          <InstrumentPanel
            channel={activeChannel}
            currentInstrument={instruments[activeChannel]}
            onInstrumentChange={handleInstrumentChange}
          />

          {/* Step Sequencer */}
          <div className="flex-1 overflow-auto">
            <StepSequencer
              channel={activeChannel}
              currentStep={currentStep}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      )}
    </div>
  )
}
