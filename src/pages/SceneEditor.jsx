import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSceneStore } from '../stores/sceneStore'
import SceneList from '../components/GameEngine/SceneList'
import SceneCanvas from '../components/GameEngine/SceneCanvas'
import DialogueEditor from '../components/GameEngine/DialogueEditor'
import ChoiceEditor from '../components/GameEngine/ChoiceEditor'
import GamePreview from '../components/GameEngine/GamePreview'
import AudioTrackPicker from '../components/GameEngine/AudioTrackPicker'
import audioEngine from '../audio/AudioEngine'

export default function SceneEditor() {
  const { projectId } = useParams()
  const navigate = useNavigate()

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

  const isDirtyRef = useRef(false)
  const saveScenesRef = useRef(saveScenes)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { saveScenesRef.current = saveScenes }, [saveScenes])

  useEffect(() => {
    loadProject(projectId)
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        const proj = projects.find(p => p.id === projectId)
        if (proj) setProjectTitle(proj.title)
      })
      .catch(() => { })
  }, [projectId, loadProject])

  const handleSave = useCallback(async () => {
    setSaving(true)
    await saveScenes()
    setSaving(false)
  }, [saveScenes])

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => { saveScenes() }, 3000)
    return () => clearTimeout(timer)
  }, [isDirty, scenes])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        const state = useSceneStore.getState()
        const body = JSON.stringify({ scenes: state.scenes })
        navigator.sendBeacon(`/api/projects/${projectId}/scenes`, new Blob([body], { type: 'application/json' }))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (isDirtyRef.current) saveScenesRef.current()
    }
  }, [projectId])

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

  const handleImageUpload = async (file, field) => {
    if (!file || !activeScene) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/images', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) updateScene(activeScene.id, { [field]: data.url })
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
  }

  const activeScene = scenes.find(s => s.id === activeSceneId)

  if (previewMode) {
    return <GamePreview scenes={scenes} onClose={stopPreview} />
  }

  const TABS = [
    { id: 'dialogue', label: 'Dialogue' },
    { id: 'choices', label: 'Choices' },
    { id: 'settings', label: 'Settings' },
    { id: 'audio', label: 'Audio' },
  ]

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header
        className="shrink-0 border-b border-border bg-bg/95 backdrop-blur-sm"
        style={{ height: '52px' }}
      >
        <div className="h-full flex items-center justify-between px-5 gap-4">

          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="font-mono text-xs text-text-muted hover:text-text transition-colors shrink-0 flex items-center gap-1"
            >
              ← Back
            </button>
            <span className="text-border/60 select-none">|</span>
            <span
              className="font-mono text-xs text-text-secondary truncate"
              title={projectTitle}
            >
              {projectTitle}
            </span>
            {isDirty && (
              <span className="font-mono text-[10px] text-text-dim shrink-0 opacity-60">
                unsaved
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* DAW */}
            <Link
              to={`/project/${projectId}/daw`}
              className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 rounded border border-border/60 hover:border-border transition-all"
            >
              ♪ DAW
            </Link>

            {/* Preview */}
            <button
              onClick={async () => { await audioEngine.init(); startPreview() }}
              className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 rounded border border-border/60 hover:border-border transition-all"
            >
              ▶ Preview
            </button>

            {/* Publish */}
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
              className="font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 rounded border border-border/60 hover:border-border transition-all"
            >
              ↑ Publish
            </button>

            {/* Save — primary */}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="font-mono text-xs px-4 py-1.5 rounded bg-text text-bg hover:opacity-90 transition-opacity disabled:opacity-25"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <SceneList projectId={projectId} />

        {/* Center */}
        <div className="flex-1 flex flex-col border-l border-r border-border overflow-hidden">
          {activeScene ? (
            <>
              {/* Canvas — takes all remaining vertical space above the panel */}
              <div className="flex-1 overflow-hidden">
                <SceneCanvas scene={activeScene} />
              </div>

              {/* ── BOTTOM PANEL ────────────────────────────── */}
              <div
                className="shrink-0 border-t border-border flex flex-col"
                style={{ height: '280px' }}
              >
                {/* Tab bar */}
                <div className="flex items-center shrink-0 border-b border-border bg-bg" style={{ gap: 0 }}>
                  {TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="font-mono text-xs tracking-wide transition-colors relative"
                      style={{
                        padding: '11px 20px',
                        color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                        background: tab === t.id ? 'var(--color-bg-card)' : 'transparent',
                        borderRight: '1px solid var(--color-border)',
                        borderBottom: tab === t.id ? '2px solid var(--color-text)' : '2px solid transparent',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-5">
                  {tab === 'dialogue' && <DialogueEditor scene={activeScene} />}
                  {tab === 'choices' && <ChoiceEditor scene={activeScene} scenes={scenes} />}

                  {tab === 'settings' && (
                    <div className="flex flex-col gap-5 max-w-2xl">

                      {/* Scene title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-xs text-text-muted">Scene Title</label>
                        <input
                          value={activeScene.title}
                          onChange={e => updateScene(activeScene.id, { title: e.target.value })}
                          className="w-full max-w-xs"
                        />
                      </div>

                      {/* Background image */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-xs text-text-muted">Background Image</label>
                        <div className="flex items-center gap-2">
                          <input
                            value={activeScene.background || ''}
                            onChange={e => updateScene(activeScene.id, { background: e.target.value || null })}
                            placeholder="Paste image URL…"
                            className="flex-1 max-w-sm"
                          />
                          <label className="font-mono text-xs px-3 py-2 border border-border/60 hover:border-border text-text-muted hover:text-text transition-all cursor-pointer shrink-0 rounded">
                            {uploading ? '…' : '↑ Upload'}
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
                          <div className="flex items-center gap-3 mt-1">
                            <img
                              src={activeScene.background}
                              alt="bg preview"
                              className="h-10 w-16 object-cover border border-border rounded"
                              onError={e => { e.target.style.display = 'none' }}
                            />
                            <button
                              onClick={() => updateScene(activeScene.id, { background: null })}
                              className="font-mono text-xs text-text-dim hover:text-red-400 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Character image */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-xs text-text-muted">Add Character</label>
                        <div className="flex items-center gap-2">
                          <input
                            id="char-name-input"
                            placeholder="Character name"
                            className="w-36"
                          />
                          <label className="font-mono text-xs px-3 py-2 border border-border/60 hover:border-border text-text-muted hover:text-text transition-all cursor-pointer shrink-0 rounded">
                            {uploading ? '…' : '↑ Upload Character'}
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

                        {activeScene.characters?.length > 0 && (
                          <div className="flex flex-col gap-2 mt-2">
                            {activeScene.characters.map((char, i) => (
                              <div key={i} className="flex items-center gap-3 font-mono text-xs text-text-muted">
                                {char.imageUrl && (
                                  <img src={char.imageUrl} alt={char.name} className="h-8 w-6 object-cover border border-border rounded" />
                                )}
                                <span className="w-24 truncate">{char.name}</span>
                                <span className="text-text-dim w-10">x:{char.x}%</span>
                                <input
                                  type="range"
                                  min={0} max={100}
                                  value={char.x || 50}
                                  onChange={e => {
                                    const chars = [...activeScene.characters]
                                    chars[i] = { ...chars[i], x: parseInt(e.target.value) }
                                    updateScene(activeScene.id, { characters: chars })
                                  }}
                                  className="w-24 accent-white"
                                />
                                <button
                                  onClick={() => {
                                    const chars = activeScene.characters.filter((_, idx) => idx !== i)
                                    updateScene(activeScene.id, { characters: chars })
                                  }}
                                  className="text-text-dim hover:text-red-400 transition-colors ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Transition */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-xs text-text-muted">Transition</label>
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
                    <div className="flex flex-col gap-4 max-w-md">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-text-muted">Scene Audio</span>
                          <span className="font-mono text-xs text-text-dim">
                            {activeScene.audioId ? 'Track attached' : 'No audio attached'}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowAudioPicker(true)}
                          className="font-mono text-xs px-4 py-2 border border-border/60 hover:border-border text-text-muted hover:text-text transition-all rounded"
                        >
                          {activeScene.audioId ? 'Change Track' : 'Attach Track'}
                        </button>
                      </div>
                      {activeScene.audioId && (
                        <button
                          onClick={() => updateScene(activeScene.id, { audioId: null })}
                          className="font-mono text-xs text-text-dim hover:text-red-400 transition-colors w-fit"
                        >
                          Remove audio
                        </button>
                      )}
                      <p className="font-mono text-xs text-text-dim leading-relaxed">
                        Tip: Compose a track in the DAW first, then attach it here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-xs text-text-muted">Select or create a scene to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Audio picker modal */}
      {showAudioPicker && (
        <AudioTrackPicker
          sceneId={activeScene?.id}
          currentTrackId={activeScene?.audioId}
          onSelect={(trackId) => {
            if (activeScene) updateScene(activeScene.id, { audioId: trackId })
            setShowAudioPicker(false)
          }}
          onClose={() => setShowAudioPicker(false)}
        />
      )}
    </div>
  )
}