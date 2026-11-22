import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import GamePreview from '../components/GameEngine/GamePreview'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fetchPublishedProject, fetchCreatorName } from '../stores/publishStore'

export default function PlayGame() {
  const { projectId } = useParams()
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(false)
  const [project, setProject] = useState(null)
  const [creatorName, setCreatorName] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const proj = await fetchPublishedProject(projectId)
        if (!proj) {
          setError('Project not found or not published.')
          setLoading(false)
          return
        }
        setProject(proj)

        if (proj.creator_name) {
          setCreatorName(proj.creator_name)
        } else if (proj.user_id) {
          const name = await fetchCreatorName(proj.user_id)
          if (name) setCreatorName(name)
        }

        // Load scenes
        let scenesData = []
        if (isSupabaseConfigured()) {
          const { data: sceneRow, error: sceneErr } = await supabase
            .from('scenes')
            .select('data')
            .eq('project_id', projectId)
            .maybeSingle()
          if (!sceneErr && sceneRow?.data) {
            scenesData = sceneRow.data
          }
        } else {
          try {
            const res = await fetch(`/api/projects/${projectId}/scenes`)
            if (res.ok) scenesData = await res.json()
          } catch { /* ignore */ }
        }

        if (!scenesData || scenesData.length === 0) {
          setError('This project has no scenes yet.')
        } else {
          setScenes(scenesData)
        }
      } catch {
        setError('Failed to load project.')
      }
      setLoading(false)
    }
    load()
  }, [projectId])

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
        <a href="/explore" style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textDecoration: 'underline', letterSpacing: '0.1em' }}>
          Browse other games
        </a>
      </div>
    )
  }

  if (started) {
    return <GamePreview scenes={scenes} onClose={() => setStarted(false)} />
  }

  return (
    <div style={{
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background cover blur */}
      {project?.cover_image && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${project.cover_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px)',
          opacity: 0.15,
          transform: 'scale(1.1)',
        }} />
      )}

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '480px',
        padding: '0 24px',
      }}>
        {/* Cover image */}
        {project?.cover_image ? (
          <div style={{
            width: '200px',
            height: '200px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '32px',
            flexShrink: 0,
          }}>
            <img src={project.cover_image} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ height: '32px' }} />
        )}

        {/* Title */}
        <h1 style={{
          fontSize: '28px', fontWeight: '700', color: '#fff',
          margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          {project?.title || 'Visual Novel'}
        </h1>

        {/* Creator */}
        {creatorName && (
          <p style={{
            fontFamily: 'monospace', fontSize: '11px',
            color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em',
            margin: '0 0 16px',
          }}>
            by {creatorName}
          </p>
        )}

        {/* Description */}
        {project?.description ? (
          <p style={{
            fontFamily: 'monospace', fontSize: '12px',
            color: 'rgba(255,255,255,0.4)', lineHeight: 1.7,
            margin: '0 0 36px', maxWidth: '360px',
          }}>
            {project.description}
          </p>
        ) : (
          <div style={{ height: '32px' }} />
        )}

        {/* Play button */}
        <button
          onClick={() => setStarted(true)}
          style={{
            fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.15em',
            textTransform: 'uppercase', padding: '14px 48px',
            background: '#fff', color: '#000', border: 'none',
            cursor: 'pointer', fontWeight: '700', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          ▶ Play
        </button>

        {/* Back to explore */}
        <a
          href="/explore"
          style={{
            fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)',
            textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase',
            marginTop: '40px', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
        >
          ← Explore
        </a>
      </div>
    </div>
  )
}
