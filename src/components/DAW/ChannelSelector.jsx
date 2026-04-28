import { useState } from 'react'
import { useDawStore } from '../../stores/dawStore'
import { CHANNEL_INFO } from '../../audio/instruments'

export default function ChannelSelector({ activeChannel }) {
  const { setActiveChannel, clearPattern } = useDawStore()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 24px',
      gap: '8px',
      background: 'rgba(255,255,255,0.015)',
    }}>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        marginRight: '8px',
        flexShrink: 0,
      }}>Channel</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {Object.entries(CHANNEL_INFO).map(([key, info]) => (
          <ChannelBtn
            key={key}
            label={info.label}
            active={activeChannel === key}
            onClick={() => setActiveChannel(key)}
          />
        ))}
      </div>

      <div style={{ marginLeft: 'auto' }}>
        <ClearBtn onClick={() => clearPattern(activeChannel)} />
      </div>
    </div>
  )
}

function ChannelBtn({ label, active, onClick }) {
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
        padding: '7px 18px',
        background: active ? '#ffffff' : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? '#0a0a0a' : hov ? '#fff' : 'rgba(255,255,255,0.45)',
        border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.1)'}`,
        cursor: 'pointer',
        fontWeight: active ? '700' : '400',
        transition: 'all 0.15s',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </button>
  )
}

function ClearBtn({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '0.15em',
        padding: '6px 14px',
        background: 'transparent',
        color: hov ? '#ff4444' : 'rgba(255,255,255,0.25)',
        border: `1px solid ${hov ? 'rgba(255,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer',
        textTransform: 'uppercase',
        transition: 'all 0.15s',
      }}
    >
      Clear Pattern
    </button>
  )
}