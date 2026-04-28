import { useState } from 'react'
import { INSTRUMENT_PRESETS } from '../../audio/instruments'

export default function InstrumentPanel({ channel, currentInstrument, onInstrumentChange }) {
  const presets = INSTRUMENT_PRESETS[channel] || []

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 24px',
      background: 'rgba(255,255,255,0.01)',
    }}>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        marginRight: '8px',
        flexShrink: 0,
      }}>Instrument</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {channel === 'drums' ? (
          <PresetBtn label="Standard Kit" active />
        ) : (
          presets.map(preset => (
            <PresetBtn
              key={preset.id}
              label={preset.name}
              active={currentInstrument === preset.id}
              onClick={() => onInstrumentChange(channel, preset.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PresetBtn({ label, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        letterSpacing: '0.12em',
        padding: '6px 16px',
        background: active ? '#ffffff' : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? '#0a0a0a' : hov ? '#fff' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.08)'}`,
        cursor: onClick ? 'pointer' : 'default',
        fontWeight: active ? '700' : '400',
        transition: 'all 0.15s',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </button>
  )
}