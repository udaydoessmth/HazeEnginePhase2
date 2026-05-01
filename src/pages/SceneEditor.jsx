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

const TABS = [
  { id: 'dialogue', label: 'Dialogue' },
  { id: 'choices', label: 'Choices' },
  { id: 'settings', label: 'Settings' },
  { id: 'audio', label: 'Audio' },
]

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
    // Try backend first, fall back to localStorage
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        const proj = projects.find(p => p.id === projectId)
        if (proj) setProjectTitle(proj.title)
      })
      .catch(() => {
        // Backend offline — read from localStorage
        try {
          const local = JSON.parse(localStorage.getItem('haze_projects') || '[]')
          const proj = local.find(p => p.id === projectId)
          if (proj) setProjectTitle(proj.title)
        } catch { }
      })
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
      // Try Express server first (when running npm run dev:all)
      let url = null
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload/images', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          url = data.url
        }
      } catch { /* server not running — fall through to base64 */ }

      // Fallback: convert to base64 data URL (works without backend)
      if (!url) {
        url = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      if (url) updateScene(activeScene.id, { [field]: url })
    } catch (err) {
      console.error('Image load failed:', err)
    }
    setUploading(false)
  }

  const activeScene = scenes.find(s => s.id === activeSceneId)

  if (previewMode) {
    return <GamePreview scenes={scenes} onClose={stopPreview} />
  }

  return (
    <div style={{
      height: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'monospace',
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        height: '52px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
        zIndex: 10,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <TopBarBtn onClick={() => navigate('/dashboard')}>← Back</TopBarBtn>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.45)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
          }}>
            {projectTitle}
          </span>
          {isDirty && (
            <span style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.1em',
              flexShrink: 0,
            }}>
              unsaved
            </span>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <NavLink to={`/project/${projectId}/daw`}>♪ DAW</NavLink>

          <ActionBtn
            onClick={async () => { await audioEngine.init(); startPreview() }}
          >
            ▶ Preview
          </ActionBtn>

          <ActionBtn
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
          >
            ↑ Publish
          </ActionBtn>

          <ActionBtn
            onClick={handleSave}
            disabled={saving || !isDirty}
            primary={isDirty}
          >
            {saving ? 'Saving...' : 'Save'}
          </ActionBtn>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <SceneList projectId={projectId} />

        {/* Center */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          {activeScene ? (
            <>
              {/* Canvas */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <SceneCanvas scene={activeScene} />
              </div>

              {/* ── Bottom Panel ── */}
              <div style={{
                height: '280px',
                flexShrink: 0,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Tab bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.015)',
                }}>
                  {TABS.map(t => (
                    <TabBtn
                      key={t.id}
                      label={t.label}
                      active={tab === t.id}
                      onClick={() => setTab(t.id)}
                    />
                  ))}
                </div>

                {/* Tab content */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                }}>
                  {tab === 'dialogue' && <DialogueEditor scene={activeScene} />}
                  {tab === 'choices' && <ChoiceEditor scene={activeScene} scenes={scenes} />}

                  {tab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>

                      {/* Scene title */}
                      <Field label="Scene Title">
                        <input
                          value={activeScene.title}
                          onChange={e => updateScene(activeScene.id, { title: e.target.value })}
                          style={{ ...fieldInputStyle, maxWidth: '280px' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </Field>

                      {/* Background image */}
                      <Field label="Background Image">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            value={activeScene.background || ''}
                            onChange={e => updateScene(activeScene.id, { background: e.target.value || null })}
                            placeholder="Paste image URL…"
                            style={{ ...fieldInputStyle, flex: 1, maxWidth: '320px' }}
                            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                          />
                          <UploadBtn uploading={uploading} label="↑ Upload">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'background')
                                e.target.value = ''
                              }}
                            />
                          </UploadBtn>
                        </div>
                        {activeScene.background && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <img
                              src={activeScene.background}
                              alt="bg preview"
                              style={{ height: '40px', width: '64px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                              onError={e => { e.target.style.display = 'none' }}
                            />
                            <button
                              onClick={() => updateScene(activeScene.id, { background: null })}
                              style={removeBtnStyle}
                              onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </Field>

                      {/* Character */}
                      <Field label="Add Character">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            id="char-name-input"
                            placeholder="Character name"
                            style={{ ...fieldInputStyle, width: '140px' }}
                            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                          />
                          <UploadBtn uploading={uploading} label="↑ Upload Character">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={async e => {
                                const file = e.target.files?.[0]
                                const nameInput = document.getElementById('char-name-input')
                                const charName = nameInput?.value || 'Character'
                                if (!file) return
                                setUploading(true)
                                try {
                                  let url = null
                                  try {
                                    const formData = new FormData()
                                    formData.append('file', file)
                                    const res = await fetch('/api/upload/images', { method: 'POST', body: formData })
                                    if (res.ok) { const data = await res.json(); url = data.url }
                                  } catch { /* server offline */ }

                                  if (!url) {
                                    url = await new Promise((resolve, reject) => {
                                      const reader = new FileReader()
                                      reader.onload = ev => resolve(ev.target.result)
                                      reader.onerror = reject
                                      reader.readAsDataURL(file)
                                    })
                                  }

                                  if (url) {
                                    const chars = [...(activeScene.characters || [])]
                                    chars.push({ name: charName, imageUrl: url, x: 50 })
                                    updateScene(activeScene.id, { characters: chars })
                                  }
                                } catch (err) {
                                  console.error('Character image failed:', err)
                                }
                                setUploading(false)
                                e.target.value = ''
                              }}
                            />
                          </UploadBtn>
                        </div>

                        {activeScene.characters?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            {activeScene.characters.map((char, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {char.imageUrl && (
                                  <img
                                    src={char.imageUrl}
                                    alt={char.name}
                                    style={{ height: '32px', width: '24px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                )}
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  color: 'rgba(255,255,255,0.5)',
                                  width: '80px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {char.name}
                                </span>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  color: 'rgba(255,255,255,0.25)',
                                  width: '36px',
                                }}>
                                  x:{char.x}%
                                </span>
                                <input
                                  type="range"
                                  min={0} max={100}
                                  value={char.x || 50}
                                  onChange={e => {
                                    const chars = [...activeScene.characters]
                                    chars[i] = { ...chars[i], x: parseInt(e.target.value) }
                                    updateScene(activeScene.id, { characters: chars })
                                  }}
                                  style={{ width: '80px', accentColor: '#fff', cursor: 'pointer' }}
                                />
                                <button
                                  onClick={() => {
                                    const chars = activeScene.characters.filter((_, idx) => idx !== i)
                                    updateScene(activeScene.id, { characters: chars })
                                  }}
                                  style={removeBtnStyle}
                                  onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </Field>

                      {/* Transition */}
                      <Field label="Transition">
                        <select
                          value={activeScene.transition}
                          onChange={e => updateScene(activeScene.id, { transition: e.target.value })}
                          style={{
                            ...fieldInputStyle,
                            maxWidth: '200px',
                            cursor: 'pointer',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.25)'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            paddingRight: '28px',
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                          <option value="fade">Fade</option>
                          <option value="slide-left">Slide Left</option>
                          <option value="slide-right">Slide Right</option>
                          <option value="cut">Cut</option>
                        </select>
                      </Field>
                    </div>
                  )}

                  {tab === 'audio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.3)',
                            display: 'block',
                            marginBottom: '4px',
                          }}>
                            Scene Audio
                          </span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: activeScene.audioId ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                            letterSpacing: '0.03em',
                          }}>
                            {activeScene.audioId ? 'Track attached' : 'No audio attached'}
                          </span>
                        </div>
                        <ActionBtn onClick={() => setShowAudioPicker(true)}>
                          {activeScene.audioId ? 'Change Track' : 'Attach Track'}
                        </ActionBtn>
                      </div>

                      {activeScene.audioId && (
                        <button
                          onClick={() => updateScene(activeScene.id, { audioId: null })}
                          style={removeBtnStyle}
                          onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                        >
                          Remove audio
                        </button>
                      )}

                      <p style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: '0.05em',
                        lineHeight: 1.7,
                        margin: 0,
                      }}>
                        Tip: Compose a track in the DAW first, then attach it here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '0.1em',
              }}>
                Select or create a scene to get started
              </p>
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
            // FIX: update the scene with the selected trackId
            if (activeScene) updateScene(activeScene.id, { audioId: trackId })
          }}
          onClose={() => setShowAudioPicker(false)}
        />
      )}
    </div>
  )
}

/* ── Shared primitives ── */

function TopBarBtn({ onClick, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.1em',
        background: 'transparent',
        border: 'none',
        color: hov ? '#fff' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        padding: '4px 0',
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

function NavLink({ to, children }) {
  const [hov, setHov] = useState(false)
  return (
    <a
      href={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.1em',
        color: hov ? '#fff' : 'rgba(255,255,255,0.4)',
        textDecoration: 'none',
        padding: '6px 14px',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </a>
  )
}

function ActionBtn({ onClick, disabled, children, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.1em',
        padding: '6px 16px',
        background: primary ? '#ffffff' : 'transparent',
        color: primary ? '#0a0a0a' : hov && !disabled ? '#fff' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${primary ? '#fff' : 'rgba(255,255,255,0.12)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        fontWeight: primary ? '700' : '400',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

function TabBtn({ label, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        padding: '11px 20px',
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? '#fff' : hov ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
        border: 'none',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: active ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function UploadBtn({ uploading, label, children }) {
  const [hov, setHov] = useState(false)
  return (
    <label
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.1em',
        padding: '6px 14px',
        background: 'transparent',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
        color: hov ? '#fff' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {uploading ? '…' : label}
      {children}
    </label>
  )
}

const fieldInputStyle = {
  fontFamily: 'monospace',
  fontSize: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  padding: '8px 10px',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
  letterSpacing: '0.03em',
  width: '100%',
}

const removeBtnStyle = {
  fontFamily: 'monospace',
  fontSize: '11px',
  letterSpacing: '0.05em',
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.25)',
  cursor: 'pointer',
  padding: 0,
  transition: 'color 0.15s',
  textAlign: 'left',
}