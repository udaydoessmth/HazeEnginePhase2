import { useState } from 'react'
import { useSceneStore } from '../../stores/sceneStore'

export default function DialogueEditor({ scene }) {
  const { addDialogue, updateDialogue, removeDialogue } = useSceneStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {scene.dialogues.map((dialogue, index) => (
        <DialogueRow
          key={dialogue.id}
          dialogue={dialogue}
          index={index}
          sceneId={scene.id}
          onUpdate={(changes) => updateDialogue(scene.id, dialogue.id, changes)}
          onRemove={() => removeDialogue(scene.id, dialogue.id)}
        />
      ))}

      <button
        onClick={() => addDialogue(scene.id)}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.12em',
          padding: '10px',
          background: 'transparent',
          border: '1px dashed rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          textTransform: 'uppercase',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
      >
        + Add Dialogue
      </button>
    </div>
  )
}

function DialogueRow({ dialogue, index, onUpdate, onRemove }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${hov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
        padding: '12px',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '9px',
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.2)',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        {hov && (
          <button
            onClick={onRemove}
            style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.1em',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,100,100,0.6)',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,100,100,0.6)'}
          >
            Remove
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          value={dialogue.characterName}
          onChange={e => onUpdate({ characterName: e.target.value })}
          placeholder="Character name"
          style={inputStyle}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <textarea
          value={dialogue.text}
          onChange={e => onUpdate({ text: e.target.value })}
          placeholder="Write dialogue text..."
          rows={2}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
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
}