import { useState, useRef, useEffect } from 'react'
import { useDawStore, NOTES } from '../../stores/dawStore'
import { SCALES_INFO } from '../../audio/instruments'

export default function TransportBar({
  isPlaying, tempo, isLooping, volume, scale, rootNote,
  onTogglePlay, onTempoChange, onToggleLoop, onVolumeChange,
}) {
  const { setScale, setRootNote } = useDawStore()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 24px',
      background: 'rgba(255,255,255,0.02)',
      flexWrap: 'wrap',
      position: 'relative',
      zIndex: 50,
    }}>
      <TransportBtn onClick={onTogglePlay} active={isPlaying} label={isPlaying ? '■  STOP' : '▶  PLAY'} wide />
      <Divider />
      <TransportBtn onClick={onToggleLoop} active={isLooping} label='↻  LOOP' />
      <Divider />

      {/* BPM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Label>BPM</Label>
        <input
          type="number"
          value={tempo}
          onChange={e => onTempoChange(parseInt(e.target.value) || 120)}
          min={40}
          max={300}
          style={{
            width: '60px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '13px',
            textAlign: 'center',
            padding: '6px 4px',
            outline: 'none',
            MozAppearance: 'textfield',
            WebkitAppearance: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      <Divider />

      {/* Key — custom dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Label>KEY</Label>
        <CustomDropdown
          value={rootNote}
          options={NOTES.map(n => ({ value: n, label: n }))}
          onChange={setRootNote}
          width="64px"
        />
      </div>

      {/* Scale — custom dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Label>SCALE</Label>
        <CustomDropdown
          value={scale}
          options={Object.entries(SCALES_INFO).map(([k, v]) => ({ value: k, label: v.name }))}
          onChange={setScale}
          width="130px"
        />
      </div>

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        <Label>VOL</Label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={e => onVolumeChange(parseInt(e.target.value) / 100)}
          style={{ width: '100px', accentColor: '#fff', cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

/* ── Custom Dropdown ─────────────────────────────────────── */
function CustomDropdown({ value, options, onChange, width }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selectedLabel = options.find(o => o.value === value)?.label || value

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '6px 10px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          outline: 'none',
          transition: 'all 0.12s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <span style={{
          fontSize: '8px',
          color: 'rgba(255,255,255,0.4)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
          flexShrink: 0,
          display: 'inline-block',
        }}>▼</span>
      </button>

      {/* Menu */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          minWidth: '100%',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          zIndex: 200,
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {options.map(opt => (
            <DropdownItem
              key={opt.value}
              label={opt.label}
              active={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ label, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        background: active ? 'rgba(255,255,255,0.12)' : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? '#fff' : hov ? '#fff' : 'rgba(255,255,255,0.55)',
        border: 'none',
        borderLeft: active ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.1s, color 0.1s',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </button>
  )
}

/* ── Primitives ──────────────────────────────────────────── */
function TransportBtn({ onClick, active, label, wide }) {
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
        padding: wide ? '8px 20px' : '8px 14px',
        background: active ? '#ffffff' : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? '#0a0a0a' : hov ? '#fff' : 'rgba(255,255,255,0.5)',
        border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.12)'}`,
        cursor: 'pointer',
        fontWeight: active ? '700' : '400',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function Label({ children }) {
  return (
    <span style={{
      fontFamily: 'monospace',
      fontSize: '10px',
      letterSpacing: '0.2em',
      color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function Divider() {
  return (
    <div style={{
      width: '1px',
      height: '20px',
      background: 'rgba(255,255,255,0.08)',
      margin: '0 4px',
      flexShrink: 0,
    }} />
  )
}