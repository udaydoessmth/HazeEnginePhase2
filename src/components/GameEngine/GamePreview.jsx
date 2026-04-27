import { useState, useEffect, useCallback } from 'react'

export default function GamePreview({ scenes, onClose }) {
  const [currentSceneId, setCurrentSceneId] = useState(scenes[0]?.id)
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const currentScene = scenes.find(s => s.id === currentSceneId)
  const currentDialogue = currentScene?.dialogues?.[dialogueIndex]

  // Typewriter effect
  useEffect(() => {
    if (!currentDialogue?.text) {
      setDisplayedText('')
      setIsTyping(false)
      // If no dialogues, show choices immediately
      if (currentScene?.choices?.length > 0) {
        setShowChoices(true)
      }
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

  const advance = useCallback(() => {
    if (!currentScene) return

    // If still typing, show full text
    if (isTyping) {
      setIsTyping(false)
      setDisplayedText(currentDialogue?.text || '')
      return
    }

    // Next dialogue
    if (dialogueIndex < (currentScene.dialogues?.length || 0) - 1) {
      setDialogueIndex(prev => prev + 1)
      return
    }

    // Show choices if any
    if (currentScene.choices?.length > 0) {
      setShowChoices(true)
      return
    }

    // Go to next scene in order
    const currentIndex = scenes.findIndex(s => s.id === currentSceneId)
    if (currentIndex < scenes.length - 1) {
      goToScene(scenes[currentIndex + 1].id)
    }
  }, [isTyping, dialogueIndex, currentScene, currentSceneId, scenes])

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
    if (choice.targetSceneId) {
      goToScene(choice.targetSceneId)
    }
  }

  // Click to advance
  const handleClick = () => {
    if (!showChoices) advance()
  }

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!showChoices) advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, showChoices, onClose])

  if (!currentScene) {
    return (
      <div className="h-screen bg-black flex items-center justify-center" onClick={onClose}>
        <p className="font-mono text-sm text-text-secondary">No scenes to preview</p>
      </div>
    )
  }

  const isEnd = !showChoices &&
    dialogueIndex >= (currentScene.dialogues?.length || 0) - 1 &&
    currentScene.choices?.length === 0 &&
    scenes.findIndex(s => s.id === currentSceneId) >= scenes.length - 1

  return (
    <div
      className="h-screen bg-black flex items-center justify-center cursor-pointer select-none"
      onClick={handleClick}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-50 font-mono text-xs text-text-muted hover:text-text px-3 py-1.5 bg-black/60 border border-border hover:border-border-hover transition-all"
      >
        ✕ Close
      </button>

      {/* Game viewport */}
      <div
        className={`relative w-full max-w-4xl aspect-video overflow-hidden transition-opacity duration-400 ${
          transitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: currentScene.background ? `url(${currentScene.background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Characters */}
        {currentScene.characters?.map((char, i) => (
          <div
            key={i}
            className="absolute bottom-16"
            style={{ left: `${char.x || 50}%`, transform: 'translateX(-50%)' }}
          >
            {char.imageUrl ? (
              <img src={char.imageUrl} alt={char.name} className="h-64 object-contain" />
            ) : (
              <div className="w-20 h-40 bg-bg-elevated/80 border border-border flex items-end justify-center pb-3">
                <span className="font-mono text-xs text-text-dim">{char.name?.[0] || '?'}</span>
              </div>
            )}
          </div>
        ))}

        {/* Dialogue box */}
        {currentDialogue && !showChoices && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/85 backdrop-blur-sm border-t border-border px-8 py-6">
            {currentDialogue.characterName && (
              <p className="font-mono text-xs text-text-secondary mb-2 tracking-wider uppercase">
                {currentDialogue.characterName}
              </p>
            )}
            <p className="font-mono text-sm text-text leading-relaxed min-h-[3em]">
              {displayedText}
              {isTyping && <span className="animate-pulse">▌</span>}
            </p>
            {!isTyping && (
              <div className="mt-3 text-right">
                <span className="font-mono text-xs text-text-dim animate-pulse">▸</span>
              </div>
            )}
          </div>
        )}

        {/* Choices */}
        {showChoices && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/85 backdrop-blur-sm border-t border-border p-8">
            <div className="space-y-2 max-w-lg mx-auto">
              {currentScene.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  onClick={(e) => { e.stopPropagation(); handleChoice(choice) }}
                  className="w-full text-left font-mono text-sm px-4 py-3 border border-border hover:border-border-hover hover:bg-bg-hover transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-text-dim mr-2">{i + 1}.</span>
                  {choice.text || 'Untitled choice'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* End screen */}
        {isEnd && !isTyping && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center animate-fade-in">
            <p className="font-mono text-sm text-text-secondary mb-6">End of story</p>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="font-mono text-xs px-6 py-2.5 border border-border hover:border-border-hover transition-colors"
            >
              Return to editor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
