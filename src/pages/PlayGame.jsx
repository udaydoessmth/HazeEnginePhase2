import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import GamePreview from '../components/GameEngine/GamePreview'

export default function PlayGame() {
  const { projectId } = useParams()
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, scenesRes] = await Promise.all([
          fetch('/api/projects'),
          fetch(`/api/projects/${projectId}/scenes`),
        ])
        const projects = await projRes.json()
        const scenesData = await scenesRes.json()
        const proj = projects.find(p => p.id === projectId)
        if (proj) setProjectTitle(proj.title)
        if (scenesData.length === 0) {
          setError('This project has no scenes.')
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
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="font-mono text-xs text-text-muted animate-pulse">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <p className="font-mono text-sm text-text-secondary mb-4">{error}</p>
        <a href="/" className="font-mono text-xs text-text-muted hover:text-text underline">Go home</a>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <h1 className="font-sans text-2xl font-300 mb-2">{projectTitle || 'Visual Novel'}</h1>
        <p className="font-mono text-xs text-text-muted mb-8">Click to start</p>
        <button
          onClick={() => setStarted(true)}
          className="font-mono text-xs px-8 py-3 border border-border hover:border-border-hover hover:bg-bg-hover transition-all"
        >
          ▶ Play
        </button>
      </div>
    )
  }

  return (
    <GamePreview
      scenes={scenes}
      onClose={() => setStarted(false)}
    />
  )
}
