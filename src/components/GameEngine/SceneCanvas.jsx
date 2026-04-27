export default function SceneCanvas({ scene }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-bg p-6 overflow-hidden">
      <div
        className="relative w-full max-w-2xl aspect-video border border-border overflow-hidden"
        style={{
          backgroundColor: scene.background ? undefined : '#0d0d0d',
          backgroundImage: scene.background ? `url(${scene.background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background label */}
        {!scene.background && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-text-dim">No background set</span>
          </div>
        )}

        {/* Characters */}
        {scene.characters?.map((char, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{ left: `${char.x || 50}%`, transform: 'translateX(-50%)' }}
          >
            {char.imageUrl ? (
              <img src={char.imageUrl} alt={char.name} className="h-48 object-contain" />
            ) : (
              <div className="w-16 h-32 bg-bg-elevated border border-border flex items-end justify-center pb-2">
                <span className="font-mono text-xs text-text-dim">{char.name?.[0] || '?'}</span>
              </div>
            )}
          </div>
        ))}

        {/* Dialogue preview */}
        {scene.dialogues?.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 border-t border-border">
            <p className="font-mono text-xs text-text-secondary mb-1">
              {scene.dialogues[0].characterName || 'Narrator'}
            </p>
            <p className="font-mono text-sm text-text leading-relaxed">
              {scene.dialogues[0].text || 'Start writing dialogue...'}
            </p>
          </div>
        )}

        {/* Scene title badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 border border-border/50">
          <span className="font-mono text-xs text-text-secondary">{scene.title}</span>
        </div>

        {/* Choices indicator */}
        {scene.choices?.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 border border-border/50">
            <span className="font-mono text-xs text-text-dim">{scene.choices.length} choice{scene.choices.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}
