export default function SceneCanvas({ scene }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '24px',
      overflow: 'hidden',
    }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          aspectRatio: '16/9',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: scene.background ? undefined : '#0d0d0d',
          backgroundImage: scene.background ? `url(${scene.background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Empty background label */}
        {!scene.background && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.15)',
              letterSpacing: '0.1em',
            }}>No background set</span>
          </div>
        )}

        {/* Characters */}
        {scene.characters?.map((char, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${char.x || 50}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {char.imageUrl ? (
              <img
                src={char.imageUrl}
                alt={char.name}
                style={{ height: '192px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                width: '64px',
                height: '128px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '8px',
              }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.25)',
                }}>
                  {char.name?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Dialogue preview */}
        {scene.dialogues?.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 20px',
          }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '6px',
              margin: '0 0 6px',
            }}>
              {scene.dialogues[0].characterName || 'Narrator'}
            </p>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {scene.dialogues[0].text || 'Start writing dialogue...'}
            </p>
          </div>
        )}

        {/* Scene title badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '4px 10px',
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.5)',
          }}>
            {scene.title}
          </span>
        </div>

        {/* Choices badge */}
        {scene.choices?.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '4px 10px',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.4)',
            }}>
              {scene.choices.length} choice{scene.choices.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}