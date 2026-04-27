import { useState, useEffect } from 'react'

export default function AudioTrackPicker({ sceneId, currentTrackId, onSelect, onClose }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/audio-tracks')
        const data = await res.json()
        setTracks(data)
      } catch {
        setTracks([])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative bg-bg-card border border-border w-full max-w-md animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-mono text-sm font-bold">Attach Audio Track</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-80 overflow-y-auto">
          {loading && (
            <p className="font-mono text-xs text-text-muted animate-pulse py-8 text-center">Loading tracks...</p>
          )}

          {!loading && tracks.length === 0 && (
            <div className="py-8 text-center">
              <p className="font-mono text-xs text-text-secondary mb-2">No audio tracks found</p>
              <p className="font-mono text-xs text-text-dim">
                Open the DAW to compose a track first.
              </p>
            </div>
          )}

          {!loading && tracks.length > 0 && (
            <div className="space-y-1">
              {/* None option */}
              <button
                onClick={() => onSelect(null)}
                className={`w-full text-left font-mono text-xs px-4 py-3 border transition-all ${
                  !currentTrackId
                    ? 'border-text text-text bg-bg-elevated'
                    : 'border-border text-text-muted hover:border-border-hover hover:text-text hover:bg-bg-hover'
                }`}
              >
                <span className="text-text-dim mr-2">—</span> No audio
              </button>

              {tracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => onSelect(track.id)}
                  className={`w-full text-left font-mono text-xs px-4 py-3 border transition-all ${
                    currentTrackId === track.id
                      ? 'border-text text-text bg-bg-elevated'
                      : 'border-border text-text-muted hover:border-border-hover hover:text-text hover:bg-bg-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{track.title || 'Untitled Track'}</span>
                    <span className="text-text-dim">{track.tempo || 120} BPM</span>
                  </div>
                  {track.audioFileUrl && (
                    <div className="mt-1 text-text-dim">♪ Audio exported</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
