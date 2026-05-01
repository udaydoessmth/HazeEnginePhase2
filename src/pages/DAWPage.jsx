import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDawStore } from '../stores/dawStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import audioEngine from '../audio/AudioEngine'
import StepSequencer from '../components/DAW/StepSequencer'
import ChannelSelector from '../components/DAW/ChannelSelector'
import TransportBar from '../components/DAW/TransportBar'
import InstrumentPanel from '../components/DAW/InstrumentPanel'

// Convert Supabase snake_case row → dawStore camelCase format
function trackFromSupabase(row) {
  return {
    id: row.id,
    title: row.title,
    projectId: row.project_id,
    tempo: row.tempo,
    scale: row.scale,
    rootNote: row.root_note,
    instruments: row.instruments,
    patterns: row.patterns,
    patternData: row.patterns,
  }
}

async function supabaseLoadTrack(trackId) {
  const { data, error } = await supabase.from('audio_tracks').select('*').eq('id', trackId).maybeSingle()
  if (error || !data) return null
  return trackFromSupabase(data)
}

async function supabaseSaveTrack(trackData, projectId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const row = {
    title: trackData.title || 'Untitled Track',
    project_id: projectId || trackData.projectId || null,
    user_id: user.id,
    tempo: trackData.tempo || 120,
    scale: trackData.scale || 'major',
    root_note: trackData.rootNote || 'C',
    instruments: trackData.instruments || {},
    patterns: trackData.patterns || {},
    updated_at: new Date().toISOString(),
  }

  if (trackData.id) {
    const { data, error } = await supabase
      .from('audio_tracks').update(row).eq('id', trackData.id).select().single()
    if (error) { console.error('[DAW] Supabase update error:', error.message); return null }
    return trackFromSupabase(data)
  } else {
    const { data, error } = await supabase
      .from('audio_tracks').insert(row).select().single()
    if (error) { console.error('[DAW] Supabase insert error:', error.message); return null }
    return trackFromSupabase(data)
  }
}

/* ── MP3 Export ──────────────────────────────────────────── */
async function exportToMp3(patterns, instruments, tempo) {
  // Render audio offline via AudioEngine helper (returns Float32Array L/R or interleaved)
  const { exportToWav } = await import('../audio/exporter')

  // We render to WAV buffer then re-encode to MP3 using lamejs
  const wavBuffer = await exportToWav(patterns, instruments, tempo, { returnBuffer: true })

  // Load lamejs from CDN if not already present
  if (!window.lamejs) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const mp3encoder = new window.lamejs.Mp3Encoder(2, 44100, 192)
  const sampleRate = 44100

  // Decode WAV buffer back to PCM
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate })
  const decoded = await audioCtx.decodeAudioData(wavBuffer)

  const leftF32 = decoded.getChannelData(0)
  const rightF32 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : decoded.getChannelData(0)

  // Convert Float32 to Int16
  const toInt16 = (f32) => {
    const i16 = new Int16Array(f32.length)
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]))
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return i16
  }

  const leftI16 = toInt16(leftF32)
  const rightI16 = toInt16(rightF32)

  const mp3Data = []
  const blockSize = 1152
  for (let i = 0; i < leftI16.length; i += blockSize) {
    const leftChunk = leftI16.subarray(i, i + blockSize)
    const rightChunk = rightI16.subarray(i, i + blockSize)
    const encoded = mp3encoder.encodeBuffer(leftChunk, rightChunk)
    if (encoded.length > 0) mp3Data.push(new Uint8Array(encoded))
  }
  const flushed = mp3encoder.flush()
  if (flushed.length > 0) mp3Data.push(new Uint8Array(flushed))

  const blob = new Blob(mp3Data, { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'track.mp3'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/* ── Component ───────────────────────────────────────────── */
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

  const isDirtyRef = useRef(false)
  const getTrackDataRef = useRef(getTrackData)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { getTrackDataRef.current = getTrackData }, [getTrackData])
  useEffect(() => { patternsRef.current = patterns }, [patterns])

  useEffect(() => {
    const init = async () => {
      if (trackId) {
        try {
          if (isSupabaseConfigured()) {
            const track = await supabaseLoadTrack(trackId)
            if (track) { loadTrack(track); return }
          } else {
            const res = await fetch(`/api/audio-tracks/${trackId}`)
            if (res.ok) { loadTrack(await res.json()); return }
          }
        } catch { /* ignore */ }
      }
      setProjectId(projectId)
      const cur = useDawStore.getState()
      if (!cur.patterns || Object.keys(cur.patterns).length === 0 || cur.projectId !== projectId) {
        initPatterns()
      }
    }
    init()
    return () => {
      audioEngine.stopPlayback()
      setIsPlaying(false)
      setCurrentStep(-1)
    }
  }, [trackId, projectId])

  const initAudio = async () => {
    await audioEngine.init()
    Object.entries(instruments).forEach(([ch, inst]) => audioEngine.changeInstrument(ch, inst))
    setAudioReady(true)
  }

  useEffect(() => {
    if (isPlaying && patternsRef.current) audioEngine.updatePatterns(patternsRef.current)
  }, [patterns, isPlaying])

  const togglePlay = useCallback(async () => {
    if (!audioReady) await initAudio()
    if (isPlaying) {
      audioEngine.stopPlayback()
      setIsPlaying(false)
      setCurrentStep(-1)
    } else {
      audioEngine.startPlayback(patternsRef.current || patterns, tempo, isLooping, (s) => setCurrentStep(s))
      setIsPlaying(true)
    }
  }, [isPlaying, tempo, isLooping, patterns, audioReady])

  useEffect(() => { if (isPlaying) audioEngine.setTempo(tempo) }, [tempo, isPlaying])
  useEffect(() => { audioEngine.setVolume(volume) }, [volume])

  const handleInstrumentChange = (channel, instrumentId) => {
    useDawStore.getState().setInstrument(channel, instrumentId)
    if (audioReady) audioEngine.changeInstrument(channel, instrumentId)
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const data = getTrackData()
      if (isSupabaseConfigured()) {
        const saved = await supabaseSaveTrack(data, projectId)
        if (saved) { setTrackId(saved.id); markClean() }
      } else {
        const url = data.id ? `/api/audio-tracks/${data.id}` : '/api/audio-tracks'
        const method = data.id ? 'PUT' : 'POST'
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { const saved = await res.json(); setTrackId(saved.id); markClean() }
      }
    } catch (err) { console.error('Save failed:', err) }
    setSaving(false)
  }, [getTrackData, markClean, setTrackId, projectId])

  useEffect(() => {
    if (!isDirty) return
    const t = setTimeout(handleSave, 8000)
    return () => clearTimeout(t)
  }, [isDirty, handleSave])

  useEffect(() => {
    const onUnload = () => {
      if (!isDirtyRef.current) return
      const data = getTrackDataRef.current()
      const url = data.id ? `/api/audio-tracks/${data.id}` : '/api/audio-tracks'
      navigator.sendBeacon(url, new Blob([JSON.stringify(data)], { type: 'application/json' }))
    }
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      if (isDirtyRef.current) handleSave()
    }
  }, [handleSave])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  return (
    <div style={{
      height: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: '48px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <TopBarBtn onClick={() => navigate(projectId ? `/project/${projectId}/editor` : '/dashboard')}>
            ← Back
          </TopBarBtn>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
          <input
            value={trackTitle}
            onChange={e => setTrackTitle(e.target.value)}
            placeholder="Track title..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'monospace', fontSize: '12px',
              color: 'rgba(255,255,255,0.6)', width: '180px', letterSpacing: '0.05em',
            }}
            onFocus={e => e.currentTarget.style.color = '#fff'}
            onBlur={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          />
          {isDirty && (
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
              unsaved
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {projectId && (
            <Link
              to={`/project/${projectId}/editor`}
              style={{
                fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                padding: '6px 14px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              Scene Editor
            </Link>
          )}

          <ActionBtn
            onClick={async () => {
              setExporting(true)
              try { await exportToMp3(patterns, instruments, tempo) }
              catch (err) { console.error('Export failed:', err) }
              setExporting(false)
            }}
            disabled={exporting || !audioReady}
          >
            {exporting ? 'Exporting...' : '↓ Export MP3'}
          </ActionBtn>

          <ActionBtn onClick={handleSave} disabled={saving || !isDirty} primary={isDirty}>
            {saving ? 'Saving...' : 'Save'}
          </ActionBtn>
        </div>
      </div>

      {/* ── Audio Init Overlay ── */}
      {!audioReady && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px',
        }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '20px',
            }}>Digital Audio Workstation</p>
            <button
              onClick={initAudio}
              style={{
                fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.15em',
                textTransform: 'uppercase', padding: '14px 32px',
                background: '#ffffff', color: '#0a0a0a', border: 'none',
                cursor: 'pointer', fontWeight: '700', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Initialize Audio Engine
            </button>
          </div>
        </div>
      )}

      {/* ── DAW Content ── */}
      {audioReady && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          maxWidth: '1600px', width: '100%', margin: '0 auto',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}>
          <TransportBar
            isPlaying={isPlaying} tempo={tempo} isLooping={isLooping}
            volume={volume} scale={scale} rootNote={rootNote}
            onTogglePlay={togglePlay} onTempoChange={setTempo}
            onToggleLoop={toggleLoop} onVolumeChange={setVolume}
          />
          <ChannelSelector activeChannel={activeChannel} />
          <InstrumentPanel
            channel={activeChannel}
            currentInstrument={instruments[activeChannel]}
            onInstrumentChange={handleInstrumentChange}
          />
          {/* Sequencer — flex: 1 + overflow so it fills remaining height and scrolls internally */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <StepSequencer channel={activeChannel} currentStep={currentStep} isPlaying={isPlaying} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shared button components ── */
function TopBarBtn({ onClick, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em',
        background: 'transparent', border: 'none',
        color: hov ? '#fff' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer', padding: '4px 0', transition: 'color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function ActionBtn({ onClick, disabled, children, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em',
        padding: '6px 16px',
        background: primary ? '#ffffff' : 'transparent',
        color: primary ? '#0a0a0a' : hov && !disabled ? '#fff' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${primary ? '#fff' : 'rgba(255,255,255,0.12)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        fontWeight: primary ? '700' : '400',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}