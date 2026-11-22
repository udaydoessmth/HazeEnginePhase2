import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { fetchPublicGames, fetchPublicMusic } from '../stores/publishStore'

const TABS = ['Games', 'Music']

export default function ExplorePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Games')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [games, setGames] = useState([])
  const [music, setMusic] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const loadAll = useCallback(async (q) => {
    setLoading(true)
    const [g, m] = await Promise.all([
      fetchPublicGames(q),
      fetchPublicMusic(q),
    ])
    setGames(g)
    setMusic(m)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll(debouncedSearch) }, [debouncedSearch, loadAll])

  const items = tab === 'Games' ? games : music

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '56px', fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(255,255,255,0.025) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 40px', position: 'relative', zIndex: 1 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
              Explore
            </p>
            <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Discover
            </h1>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px 16px',
              outline: 'none',
              width: '220px',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '40px' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? '#fff' : 'transparent'}`,
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: '-1px',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Loading...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div style={{ padding: '80px 0', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              {debouncedSearch ? `No ${tab.toLowerCase()} matching "${debouncedSearch}"` : `No ${tab.toLowerCase()} published yet.`}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1px',
            background: 'rgba(255,255,255,0.06)',
          }}>
            {tab === 'Games'
              ? items.map(game => (
                <GameCard key={game.id} game={game} onClick={() => navigate(`/play/${game.id}`)} />
              ))
              : items.map(track => (
                <MusicCard key={track.id} track={track} onClick={() => navigate(`/music/${track.id}`)} />
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

function GameCard({ game, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#111111' : '#0a0a0a',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover */}
      <div style={{
        aspectRatio: '16/9',
        background: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {game.cover_image ? (
          <img src={game.cover_image} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '32px', opacity: 0.15 }}>📖</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
          {game.title}
        </h3>
        {game.genre && (
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {game.genre}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', opacity: hovered ? 1 : 0.6, transition: 'opacity 0.15s' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
            {game.published_at ? new Date(game.published_at).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function MusicCard({ track, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#111111' : '#0a0a0a',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Artwork */}
      <div style={{
        aspectRatio: '1/1',
        background: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {track.cover_image ? (
          <img src={track.cover_image} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '40px', opacity: 0.15 }}>♪</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
          {track.title}
        </h3>
        {track.genre && (
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0' }}>
            {track.genre}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', opacity: hovered ? 1 : 0.6, transition: 'opacity 0.15s' }}>
            ▶ Listen
          </span>
        </div>
      </div>
    </div>
  )
}
