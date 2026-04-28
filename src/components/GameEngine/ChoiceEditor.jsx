import { useState } from 'react'
import { useSceneStore } from '../../stores/sceneStore'

export default function ChoiceEditor({ scene, scenes }) {
  const { addChoice, updateChoice, removeChoice } = useSceneStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {scene.choices.map((choice, index) => (
        <ChoiceRow
          key={choice.id}
          choice={choice}
          index={index}
          scenes={scenes}
          sceneId={scene.id}
          onUpdate={(changes) => updateChoice(scene.id, choice.id, changes)}
          onRemove={() => removeChoice(scene.id, choice.id)}
        />
      ))}

      <button
        onClick={() => addChoice(scene.id)}
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
        + Add Choice
      </button>

      {scene.choices.length === 0 && (
        <p style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.05em',
          lineHeight: 1.6,
          margin: 0,
        }}>
          No choices — scene continues to the next in order, or ends the story.
        </p>
      )}
    </div>
  )
}

function ChoiceRow({ choice, index, scenes, sceneId, onUpdate, onRemove }) {
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
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
        }}>
          Choice {index + 1}
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
          value={choice.text}
          onChange={e => onUpdate({ text: e.target.value })}
          placeholder="Choice text (e.g. 'Go left')"
          style={inputStyle}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <div>
          <label style={{
            display: 'block',
            fontFamily: 'monospace',
            fontSize: '9px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            marginBottom: '5px',
          }}>
            Goes to scene
          </label>
          <select
            value={choice.targetSceneId || ''}
            onChange={e => onUpdate({ targetSceneId: e.target.value || null })}
            style={{
              ...inputStyle,
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
            <option value="">— Select scene —</option>
            {scenes.filter(s => s.id !== sceneId).map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
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