import { useState } from 'react'
import { useSceneStore } from '../../stores/sceneStore'

export default function SceneList() {
  const { scenes, activeSceneId, addScene, removeScene, setActiveScene } = useSceneStore()

  return (
    <div style={{
      width: '200px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.015)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}>Scenes</span>
        <button
          onClick={addScene}
          style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.4)',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          title="Add Scene"
        >
          +
        </button>
      </div>

      {/* Scene Items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {scenes.map((scene, index) => (
          <SceneRow
            key={scene.id}
            scene={scene}
            index={index}
            isActive={activeSceneId === scene.id}
            canRemove={scenes.length > 1}
            onSelect={() => setActiveScene(scene.id)}
            onRemove={() => removeScene(scene.id)}
          />
        ))}
      </div>

      {/* Footer count */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.2)',
        }}>
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

function SceneRow({ scene, index, isActive, canRemove, onSelect, onRemove }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: isActive
          ? 'rgba(255,255,255,0.07)'
          : hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderLeft: isActive ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
        transition: 'all 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '9px',
          color: 'rgba(255,255,255,0.2)',
          flexShrink: 0,
          letterSpacing: '0.05em',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.12s',
          letterSpacing: '0.03em',
        }}>
          {scene.title}
        </span>
      </div>
      {canRemove && hov && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,100,100,0.7)',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '0 2px',
            flexShrink: 0,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,100,100,0.7)'}
        >
          ×
        </button>
      )}
    </div>
  )
}