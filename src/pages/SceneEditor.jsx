import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSceneStore } from '../stores/sceneStore'
import SceneList from '../components/GameEngine/SceneList'
import SceneCanvas from '../components/GameEngine/SceneCanvas'
import DialogueEditor from '../components/GameEngine/DialogueEditor'
import ChoiceEditor from '../components/GameEngine/ChoiceEditor'
import GamePreview from '../components/GameEngine/GamePreview'
import AudioTrackPicker from '../components/GameEngine/AudioTrackPicker'

export default function SceneEditor() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const {
    scenes, activeSceneId, isDirty, previewMode,
    setScenes, addScene, setActiveScene, updateScene,
    startPreview, stopPreview, markClean,
  } = useSceneStore()

  const [projectTitle, setProjectTitle] = useState('Untitled Project')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('dialogue') // dialogue | choices | settings
  const [showAudioPicker, setShowAudioPicker] = useState(false)
  const [audioTracks, setAudioTracks] = useState([])

  // Load scenes
  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, scenesRes] = await Promise.all([
          fetch(`/api/projects`),
          fetch(`/api/projects/${projectId}/scenes`),
        ])
        const projects = await projRes.json()
        const scenesData = await scenesRes.json()
        const proj = projects.find(p => p.id === projectId)
        if (proj) setProjectTitle(proj.title)
        if (scenesData.length > 0) {
          setScenes(scenesData)
          if (!activeSceneId) setActiveScene(scenesData[0].id)
        } else {
          // Add first scene
          addScene()
        }
      } catch {
        addScene()
      }
    }
    load()
  }, [projectId])

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/scenes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      })
      markClean()
    } catch (err) {
      console.error('Save failed:', err)
    }
    setSaving(false)
  }, [scenes, projectId, markClean])

  // Autosave
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(handleSave, 5000)
    return () => clearTimeout(timer)
  }, [isDirty, handleSave])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const activeScene = scenes.find(s => s.id === activeSceneId)

  if (previewMode) {
    return <GamePreview scenes={scenes} onClose={stopPreview} />
  }

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-mono text-xs text-text-muted hover:text-text transition-colors"
          >
            ← Back
          </button>
          <span className="text-text-dim">|</span>
          <span className="font-mono text-xs text-text-secondary">{projectTitle}</span>
          {isDirty && <span className="font-mono text-xs text-text-dim">(unsaved)</span>}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/project/${projectId}/daw`}
            className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 border border-border hover:border-border-hover transition-all"
          >
            ♪ DAW
          </Link>
          <button
            onClick={() => startPreview()}
            className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 border border-border hover:border-border-hover transition-all"
          >
            ▶ Preview
          </button>
          <button
            onClick={async () => {
              // Save first
              await handleSave()
              // Publish
              try {
                await fetch(`/api/projects/${projectId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isPublished: true, publishedAt: new Date().toISOString() }),
                })
                const url = `${window.location.origin}/play/${projectId}`
                await navigator.clipboard.writeText(url)
                alert(`Published! Link copied:\n${url}`)
              } catch (err) {
                console.error('Publish failed:', err)
              }
            }}
            className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 border border-border hover:border-border-hover transition-all"
          >
            ↑ Publish
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

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Scene List */}
        <SceneList projectId={projectId} />

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col border-l border-r border-border overflow-hidden">
          {activeScene ? (
            <>
              {/* Scene Canvas Preview */}
              <SceneCanvas scene={activeScene} />

              {/* Bottom Tabs */}
              <div className="border-t border-border shrink-0">
                <div className="flex border-b border-border">
                  {['dialogue', 'choices', 'settings', 'audio'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`font-mono text-xs px-4 py-2.5 transition-colors ${
                        tab === t
                          ? 'text-text bg-bg-card border-b border-text'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="h-64 overflow-y-auto p-4">
                  {tab === 'dialogue' && <DialogueEditor scene={activeScene} />}
                  {tab === 'choices' && <ChoiceEditor scene={activeScene} scenes={scenes} />}
                  {tab === 'settings' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-mono text-xs text-text-muted mb-1">Scene Title</label>
                        <input
                          value={activeScene.title}
                          onChange={e => updateScene(activeScene.id, { title: e.target.value })}
                          className="w-full max-w-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs text-text-muted mb-1">Background Image URL</label>
                        <input
                          value={activeScene.background || ''}
                          onChange={e => updateScene(activeScene.id, { background: e.target.value || null })}
                          placeholder="Paste image URL or upload"
                          className="w-full max-w-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs text-text-muted mb-1">Transition</label>
                        <select
                          value={activeScene.transition}
                          onChange={e => updateScene(activeScene.id, { transition: e.target.value })}
                          className="max-w-xs"
                        >
                          <option value="fade">Fade</option>
                          <option value="slide-left">Slide Left</option>
                          <option value="slide-right">Slide Right</option>
                          <option value="cut">Cut</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {tab === 'audio' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-mono text-xs text-text-muted mb-1">Scene Audio</label>
                          <p className="font-mono text-xs text-text-dim">
                            {activeScene.audioTrackId ? 'Audio track attached' : 'No audio attached'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAudioPicker(true)}
                          className="font-mono text-xs px-4 py-2 border border-border hover:border-border-hover text-text-muted hover:text-text transition-all"
                        >
                          {activeScene.audioTrackId ? 'Change Track' : 'Attach Track'}
                        </button>
                      </div>
                      {activeScene.audioTrackId && (
                        <button
                          onClick={() => updateScene(activeScene.id, { audioTrackId: null })}
                          className="font-mono text-xs text-text-dim hover:text-error transition-colors"
                        >
                          Remove audio
                        </button>
                      )}
                      <p className="font-mono text-xs text-text-dim">
                        Tip: Compose a track in the DAW first, then attach it here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-xs text-text-muted">Select or create a scene</p>
            </div>
          )}
        </div>
      </div>

      {/* Audio Track Picker */}
      {showAudioPicker && (
        <AudioTrackPicker
          sceneId={activeScene?.id}
          currentTrackId={activeScene?.audioTrackId}
          onSelect={(trackId) => {
            if (activeScene) updateScene(activeScene.id, { audioTrackId: trackId })
            setShowAudioPicker(false)
          }}
          onClose={() => setShowAudioPicker(false)}
        />
      )}
    </div>
  )
}
