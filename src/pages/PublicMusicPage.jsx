import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPublishedTrack } from '../stores/publishStore'

export default function PublicMusicPage() {
  const { trackId } = useParams()
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Audio player state
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const load = async () => {
      const data = await fetchPublishedTrack(trackId)
      if (!data) { setError('Track not found or not published.'); setLoading(false); return }
      setTrack(data)
      // Use stored creator_name first; fall back to profiles lookup
      if (data.creator_name) {
        setCreatorName(data.creator_name)
      } else if (data.user_id) {
        const name = await fetchCreatorName(data.user_id)
        if (name) setCreatorName(name)
      }
      setLoading(false)
    }
    load()
  }, [trackId])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play(); setIsPlaying(true) }
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    audio.currentTime = fraction * duration
  }

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{error}</p>
        <a href="/" style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textDecoration: 'underline', letterSpacing: '0.1em' }}>Go home</a>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blur */}
      {track?.cover_image && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${track.cover_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px)',
          opacity: 0.12,
          transform: 'scale(1.1)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', width: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

        {/* Artwork */}
        <div style={{
          width: '220px',
          height: '220px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {track?.cover_image ? (
            <img src={track.cover_image} alt="Artwork" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '48px', opacity: 0.3 }}>♪</span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.1, textAlign: 'center' }}>
          {track?.title}
        </h1>

        {/* Creator */}
        {creatorName && creatorName !== 'Unknown' && (
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', margin: '0 0 12px' }}>
            by {creatorName}
          </p>
        )}

        {/* Genre */}
        {track?.genre && (
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>
            {track.genre}
          </p>
        )}

        {/* Description */}
        {track?.description && (
          <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, textAlign: 'center', margin: '0 0 36px', maxWidth: '360px' }}>
            {track.description}
          </p>
        )}

        {!track?.description && <div style={{ height: '24px' }} />}

        {/* Audio Player */}
        {track?.audio_url ? (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <audio
              ref={audioRef}
              src={track.audio_url}
              onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
              onLoadedMetadata={e => setDuration(e.target.duration)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Play/Pause + Seek */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Play button */}
              <button
                onClick={togglePlay}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              {/* Progress bar + times */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Seek bar */}
                <div
                  onClick={handleSeek}
                  style={{
                    height: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    position: 'relative',
                    borderRadius: '2px',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    background: '#fff',
                    borderRadius: '2px',
                    transition: 'width 0.1s linear',
                  }} />
                </div>
                {/* Time labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    {formatTime(currentTime)}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            No audio available for this track.
          </p>
        )}

        {/* Back link */}
        <a
          href="/explore"
          style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '48px', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
        >
          ← Explore
        </a>
      </div>
    </div>
  )
}
