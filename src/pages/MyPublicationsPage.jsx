import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { fetchMyGames, fetchMyMusic, unpublishProject, unpublishTrack } from '../stores/publishStore'

const TABS = ['My Games', 'My Music']

export default function MyPublicationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('My Games')
  const [games, setGames] = useState([])
  const [music, setMusic] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [g, m] = await Promise.all([
      fetchMyGames(user.id),
      fetchMyMusic(user.id),
    ])
    setGames(g)
    setMusic(m)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const handleUnpublishGame = async (id) => {
    await unpublishProject(id)
    setGames(g => g.filter(x => x.id !== id))
  }

  const handleUnpublishTrack = async (id) => {
    await unpublishTrack(id)
    setMusic(m => m.filter(x => x.id !== id))
  }

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).catch(() => {})
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '56px' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Please log in to view your publications.</p>
        </div>
      </div>
    )
  }

  const items = tab === 'My Games' ? games : music

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '56px', fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255,255,255,0.025) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 40px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
            My Publications
          </p>
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Published Work
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '40px' }}>
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
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Loading...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div style={{ padding: '80px 40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '24px' }}>
              You haven't published any {tab === 'My Games' ? 'games' : 'music'} yet.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {tab === 'My Music' && (
                <button
                  onClick={() => navigate('/daw')}
                  style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 24px', background: '#fff', color: '#0a0a0a', border: 'none', cursor: 'pointer', fontWeight: '700', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  ♪ Make Music
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 24px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Publications list */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
            {tab === 'My Games'
              ? games.map(game => (
                <PublicationRow
                  key={game.id}
                  title={game.title}
                  subtitle={game.genre || ''}
                  coverImage={game.cover_image}
                  publishedAt={game.published_at}
                  visibility={game.visibility}
                  type="game"
                  url={`${window.location.origin}/play/${game.id}`}
                  onOpen={() => window.open(`/play/${game.id}`, '_blank')}
                  onCopy={() => copyLink(`${window.location.origin}/play/${game.id}`)}
                  onUnpublish={() => handleUnpublishGame(game.id)}
                />
              ))
              : music.map(track => (
                <PublicationRow
                  key={track.id}
                  title={track.title}
                  subtitle={track.genre || ''}
                  coverImage={track.cover_image}
                  publishedAt={track.published_at}
                  visibility={track.visibility}
                  type="music"
                  url={`${window.location.origin}/music/${track.id}`}
                  onOpen={() => window.open(`/music/${track.id}`, '_blank')}
                  onCopy={() => copyLink(`${window.location.origin}/music/${track.id}`)}
                  onUnpublish={() => handleUnpublishTrack(track.id)}
                />
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

function PublicationRow({ title, subtitle, coverImage, publishedAt, visibility, type = 'music', url, onOpen, onCopy, onUnpublish }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmUnpublish(false) }}
      style={{
        background: hovered ? '#111' : '#0a0a0a',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'background 0.15s',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '48px',
        height: '48px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {coverImage ? (
          <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '18px', opacity: 0.2 }}>{type === 'game' ? '📖' : '♪'}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {subtitle && (
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {subtitle}
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: visibility === 'public' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }} />
            {visibility || 'public'}
          </span>
          {publishedAt && (
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.15)' }}>
              {new Date(publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <SmallBtn onClick={onOpen}>Open ↗</SmallBtn>
        <SmallBtn onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy Link'}</SmallBtn>
        {confirmUnpublish ? (
          <>
            <SmallBtn onClick={onUnpublish} danger>Confirm</SmallBtn>
            <SmallBtn onClick={() => setConfirmUnpublish(false)}>Cancel</SmallBtn>
          </>
        ) : (
          <SmallBtn onClick={() => setConfirmUnpublish(true)} danger>Unpublish</SmallBtn>
        )}
      </div>
    </div>
  )
}

function SmallBtn({ onClick, children, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '6px 12px',
        background: 'transparent',
        border: `1px solid ${hov ? (danger ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.1)'}`,
        color: hov ? (danger ? '#ff6666' : '#fff') : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
