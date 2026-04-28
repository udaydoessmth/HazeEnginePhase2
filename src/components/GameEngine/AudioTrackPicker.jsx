import { useState, useEffect } from 'react'

export default function AudioTrackPicker({ sceneId, currentTrackId, onSelect, onClose }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/audio-tracks')
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.tracks ?? [])
        console.log('[AudioTrackPicker] loaded tracks:', list)
        setTracks(list)
      } catch (err) {
        console.error('[AudioTrackPicker] failed to load tracks:', err)
        setTracks([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSelect = (trackId) => {
    console.log('[AudioTrackPicker] handleSelect called with trackId:', trackId)
    console.log('[AudioTrackPicker] sceneId:', sceneId)
    onSelect(trackId)
    // Small delay before closing so the state update has time to register
    setTimeout(() => onClose(), 50)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#fff',
              margin: 0,
              fontWeight: '600',
            }}>
              Attach Audio Track
            </h3>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              margin: '5px 0 0',
              letterSpacing: '0.05em',
            }}>
              Select a track to play during this scene
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '18px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            ×
          </button>
        </div>

        {/* Current state indicator */}
        <div style={{
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.2)',
          }}>
            Current: {currentTrackId ? `track ${currentTrackId}` : 'none'}
          </span>
        </div>

        {/* Track list */}
        <div style={{ overflowY: 'auto', padding: '10px' }}>
          {loading && (
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center',
              padding: '32px 0',
              letterSpacing: '0.1em',
              margin: 0,
            }}>
              Loading tracks...
            </p>
          )}

          {!loading && tracks.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                margin: '0 0 8px',
              }}>
                No audio tracks found
              </p>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '0.05em',
                margin: 0,
              }}>
                Open the DAW and save a track first.
              </p>
            </div>
          )}

          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <TrackRow
                active={!currentTrackId}
                onClick={() => handleSelect(null)}
                title="No audio"
                subtitle="Silence"
                isNone
              />
              {tracks.map(track => (
                <TrackRow
                  key={track.id}
                  active={currentTrackId === track.id}
                  onClick={() => handleSelect(track.id)}
                  title={track.title || 'Untitled Track'}
                  subtitle={`${track.tempo ?? 120} BPM`}
                  hasExport={!!track.audioFileUrl}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TrackRow({ active, onClick, title, subtitle, isNone, hasExport }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 14px',
        background: active ? 'rgba(255,255,255,0.08)' : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1px solid ${active ? 'rgba(255,255,255,0.28)' : hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        borderLeft: active ? '2px solid rgba(255,255,255,0.65)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.12s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: isNone ? 'rgba(255,255,255,0.3)' : active ? '#fff' : hov ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.55)',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontStyle: isNone ? 'italic' : 'normal',
          letterSpacing: '0.03em',
          transition: 'color 0.12s',
        }}>
          {title}
        </span>
        {hasExport && (
          <span style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.22)',
            letterSpacing: '0.08em',
            marginTop: '2px',
            display: 'block',
          }}>
            ♪ mp3 exported
          </span>
        )}
      </div>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.22)',
        flexShrink: 0,
        letterSpacing: '0.08em',
      }}>
        {subtitle}
      </span>
    </button>
  )
}