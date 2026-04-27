import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Pull store values individually to avoid unnecessary re-renders
  const scenes = useSceneStore(s => s.scenes)
  const activeSceneId = useSceneStore(s => s.activeSceneId)
  const isDirty = useSceneStore(s => s.isDirty)
  const previewMode = useSceneStore(s => s.previewMode)
  const loadProject = useSceneStore(s => s.loadProject)
  const addScene = useSceneStore(s => s.addScene)
  const setActiveScene = useSceneStore(s => s.setActiveScene)
  const updateScene = useSceneStore(s => s.updateScene)
  const startPreview = useSceneStore(s => s.startPreview)
  const stopPreview = useSceneStore(s => s.stopPreview)
  const saveScenes = useSceneStore(s => s.saveScenes)

  const [projectTitle, setProjectTitle] = useState('Untitled Project')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('dialogue')
  const [showAudioPicker, setShowAudioPicker] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Refs for save-on-unmount (avoids stale closures)
  const isDirtyRef = useRef(false)
  const saveScenesRef = useRef(saveScenes)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { saveScenesRef.current = saveScenes }, [saveScenes])

  // Load project data — only once per projectId
  useEffect(() => {
    loadProject(projectId)

    // Fetch project title separately
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        const proj = projects.find(p => p.id === projectId)
        if (proj) setProjectTitle(proj.title)
      })
      .catch(() => {})
  }, [projectId, loadProject])

  // Save function
  const handleSave = useCallback(async () => {
    setSaving(true)
    await saveScenes()
    setSaving(false)
  }, [saveScenes])

  // Autosave — 3 second debounce
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      saveScenes()
    }, 3000)
    return () => clearTimeout(timer)
  }, [isDirty, scenes]) // re-trigger on scenes change too

  // Save on unmount / page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        // Synchronous save via sendBeacon
        const state = useSceneStore.getState()
        const body = JSON.stringify({ scenes: state.scenes })
        navigator.sendBeacon(
          `/api/projects/${projectId}/scenes`,
          new Blob([body], { type: 'application/json' })
        )
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Save on component unmount (navigate away)
      if (isDirtyRef.current) {
        saveScenesRef.current()
      }
    }
  }, [projectId])

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

  // Image upload handler
  const handleImageUpload = async (file, field) => {
    if (!file || !activeScene) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        updateScene(activeScene.id, { [field]: data.url })
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
  }

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
              await handleSave()
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

                      {/* Background Image — URL or Upload */}
                      <div>
                        <label className="block font-mono text-xs text-text-muted mb-1">Background Image</label>
                        <div className="flex items-center gap-2 max-w-lg">
                          <input
                            value={activeScene.background || ''}
                            onChange={e => updateScene(activeScene.id, { background: e.target.value || null })}
                            placeholder="Paste URL or upload file →"
                            className="flex-1"
                          />
                          <label className="font-mono text-xs px-3 py-2.5 border border-border hover:border-border-hover text-text-muted hover:text-text transition-all cursor-pointer shrink-0">
                            {uploading ? '...' : '↑ Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'background')
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                        {activeScene.background && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={activeScene.background}
                              alt="bg preview"
                              className="h-12 w-20 object-cover border border-border"
                              onError={e => { e.target.style.display = 'none' }}
                            />
                            <button
                              onClick={() => updateScene(activeScene.id, { background: null })}
                              className="font-mono text-xs text-text-dim hover:text-error transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Character Image Upload */}
                      <div>
                        <label className="block font-mono text-xs text-text-muted mb-1">Add Character Image</label>
                        <div className="flex items-center gap-2 max-w-lg">
                          <input
                            id="char-name-input"
                            placeholder="Character name"
                            className="w-32"
                          />
                          <label className="font-mono text-xs px-3 py-2.5 border border-border hover:border-border-hover text-text-muted hover:text-text transition-all cursor-pointer shrink-0">
                            {uploading ? '...' : '↑ Upload Character'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async e => {
                                const file = e.target.files?.[0]
                                const nameInput = document.getElementById('char-name-input')
                                const charName = nameInput?.value || 'Character'
                                if (!file) return
                                setUploading(true)
                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  const res = await fetch('/api/upload/images', { method: 'POST', body: formData })
                                  const data = await res.json()
                                  if (data.url) {
                                    const chars = [...(activeScene.characters || [])]
                                    chars.push({ name: charName, imageUrl: data.url, x: 50 })
                                    updateScene(activeScene.id, { characters: chars })
                                  }
                                } catch (err) {
                                  console.error('Character upload failed:', err)
                                }
                                setUploading(false)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                        {/* Show existing characters */}
                        {activeScene.characters?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {activeScene.characters.map((char, i) => (
                              <div key={i} className="flex items-center gap-2 font-mono text-xs text-text-muted">
                                {char.imageUrl && (
                                  <img src={char.imageUrl} alt={char.name} className="h-8 w-6 object-cover border border-border" />
                                )}
                                <span>{char.name}</span>
                                <span className="text-text-dim">x:{char.x}%</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={char.x || 50}
                                  onChange={e => {
                                    const chars = [...activeScene.characters]
                                    chars[i] = { ...chars[i], x: parseInt(e.target.value) }
                                    updateScene(activeScene.id, { characters: chars })
                                  }}
                                  className="w-20 accent-white"
                                />
                                <button
                                  onClick={() => {
                                    const chars = activeScene.characters.filter((_, idx) => idx !== i)
                                    updateScene(activeScene.id, { characters: chars })
                                  }}
                                  className="text-text-dim hover:text-error transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
