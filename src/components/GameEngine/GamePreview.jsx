import { useState, useEffect, useCallback, useRef } from 'react'
import audioEngine from '../../audio/AudioEngine'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export default function GamePreview({ scenes, onClose }) {
  const [currentSceneId, setCurrentSceneId] = useState(scenes[0]?.id)
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const audioInitialized = useRef(false)

  const currentScene = scenes.find(s => s.id === currentSceneId)
  const currentDialogue = currentScene?.dialogues?.[dialogueIndex]

  // ── Audio playback ──────────────────────────────────────────
  useEffect(() => {
    let active = true

    const playSceneAudio = async () => {
      audioEngine.stopPlayback()
      if (!currentScene?.audioId) return

      try {
        let track = null

        // Try Supabase first
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('audio_tracks')
            .select('id, title, tempo, instruments, patterns')
            .eq('id', currentScene.audioId)
            .maybeSingle()
          if (!error && data) {
            track = {
              id: data.id,
              title: data.title,
              tempo: data.tempo,
              instruments: data.instruments,
              patterns: data.patterns,
            }
          }
        }

        // Fallback: Express server
        if (!track) {
          const res = await fetch(`/api/audio-tracks/${currentScene.audioId}`)
          if (res.ok) track = await res.json()
        }

        if (!track || !active) return

        const patterns = track.patterns ?? track.patternData
        if (!patterns || Object.keys(patterns).length === 0) {
          console.warn('[GamePreview] Track has no pattern data', track)
          return
        }

        if (!audioInitialized.current) {
          await audioEngine.init()
          audioInitialized.current = true
        }

        if (!active) return

        if (track.instruments) {
          Object.entries(track.instruments).forEach(([ch, inst]) => {
            audioEngine.changeInstrument(ch, inst)
          })
        }

        await new Promise(r => setTimeout(r, 80))
        if (!active) return

        audioEngine.startPlayback(patterns, track.tempo ?? 120, true, () => {})
      } catch (err) {
        console.error('[GamePreview] Audio load failed:', err)
      }
    }

    playSceneAudio()

    return () => {
      active = false
      audioEngine.stopPlayback()
    }
  }, [currentScene?.audioId])

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopPlayback()
    }
  }, [])

  // ── Typewriter ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentDialogue?.text) {
      setDisplayedText('')
      setIsTyping(false)
      if (currentScene?.choices?.length > 0) setShowChoices(true)
      return
    }

    setIsTyping(true)
    setDisplayedText('')
    let i = 0
    const text = currentDialogue.text
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, 30)

    return () => clearInterval(timer)
  }, [currentDialogue?.text, currentSceneId, dialogueIndex])

  // ── Navigation ──────────────────────────────────────────────
  const advance = useCallback(() => {
    if (!currentScene) return

    if (isTyping) {
      setIsTyping(false)
      setDisplayedText(currentDialogue?.text || '')
      return
    }

    if (dialogueIndex < (currentScene.dialogues?.length || 0) - 1) {
      setDialogueIndex(prev => prev + 1)
      return
    }

    if (currentScene.choices?.length > 0) {
      setShowChoices(true)
      return
    }

    const currentIndex = scenes.findIndex(s => s.id === currentSceneId)
    if (currentIndex < scenes.length - 1) {
      goToScene(scenes[currentIndex + 1].id)
    }
  }, [isTyping, dialogueIndex, currentScene, currentSceneId, scenes, currentDialogue])

  const goToScene = (sceneId) => {
    setTransitioning(true)
    setTimeout(() => {
      setCurrentSceneId(sceneId)
      setDialogueIndex(0)
      setShowChoices(false)
      setTransitioning(false)
    }, 400)
  }

  const handleChoice = (choice) => {
    if (choice.targetSceneId) goToScene(choice.targetSceneId)
  }

  const handleClick = () => {
    if (!showChoices) advance()
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if ((e.key === ' ' || e.key === 'Enter') && !showChoices) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, showChoices, onClose])

  // ── Empty state ─────────────────────────────────────────────
  if (!currentScene) {
    return (
      <div
        onClick={onClose}
        style={{
          height: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <p style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          No scenes to preview
        </p>
      </div>
    )
  }

  const isEnd =
    !showChoices &&
    dialogueIndex >= (currentScene.dialogues?.length || 0) - 1 &&
    (currentScene.choices?.length ?? 0) === 0 &&
    scenes.findIndex(s => s.id === currentSceneId) >= scenes.length - 1

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      style={{
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 50,
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.45)',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '6px 14px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
      >
        ✕ Close
      </button>

      {/* Game viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '896px',
          aspectRatio: '16/9',
          overflow: 'hidden',
          backgroundColor: '#0a0a0a',
          backgroundImage: currentScene.background ? `url(${currentScene.background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* Characters */}
        {currentScene.characters?.map((char, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '64px',
              left: `${char.x || 50}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {char.imageUrl ? (
              <img
                src={char.imageUrl}
                alt={char.name}
                style={{ height: '256px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '160px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '12px',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  {char.name?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Dialogue box */}
        {currentDialogue && !showChoices && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '24px 32px',
          }}>
            {currentDialogue.characterName && (
              <p style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '10px',
              }}>
                {currentDialogue.characterName}
              </p>
            )}
            <p style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#fff',
              lineHeight: 1.7,
              minHeight: '3em',
              margin: 0,
            }}>
              {displayedText}
              {isTyping && (
                <span style={{ animation: 'blink 0.8s step-end infinite' }}>▌</span>
              )}
            </p>
            {!isTyping && (
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.3)',
                  animation: 'blink 1s step-end infinite',
                }}>▸</span>
              </div>
            )}
          </div>
        )}

        {/* Choices */}
        {showChoices && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '24px 32px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '480px',
              margin: '0 auto',
            }}>
              {currentScene.choices.map((choice, i) => (
                <ChoiceBtn
                  key={choice.id}
                  index={i}
                  text={choice.text || 'Untitled choice'}
                  onClick={(e) => { e.stopPropagation(); handleChoice(choice) }}
                />
              ))}
            </div>
          </div>
        )}

        {/* End screen */}
        {isEnd && !isTyping && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            animation: 'fadeIn 0.5s ease',
          }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
            }}>
              End of story
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '12px 28px',
                background: '#fff',
                color: '#0a0a0a',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Return to editor
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  )
}

function ChoiceBtn({ index, text, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '12px 16px',
        background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
        color: hov ? '#fff' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        letterSpacing: '0.03em',
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '10px' }}>{index + 1}.</span>
      {text}
    </button>
  )
}