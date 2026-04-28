import { useState } from 'react'
import { useDawStore, STEPS } from '../../stores/dawStore'

const DRUM_LABELS = {
  kick: 'KCK',
  snare: 'SNR',
  hihat: 'HHT',
  rimshot: 'RIM',
}

export default function StepSequencer({ channel, currentStep, isPlaying }) {
  const { patterns, toggleNote } = useDawStore()
  const pattern = patterns[channel]

  if (!pattern) return (
    <div style={{
      padding: '40px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.2)',
      textAlign: 'center',
    }}>
      Loading pattern...
    </div>
  )

  const { grid, rows } = pattern
  const isDrums = channel === 'drums'

  return (
    /* Outer: fills flex container, centers content both axes */
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflowX: 'auto',
      overflowY: 'auto',
      background: '#0a0a0a',
      padding: '32px 24px',
    }}>
      {/* Inner wrapper — inline-block so it shrinks to content, but sits centered */}
      <div style={{ display: 'inline-block' }}>

        {/* Step number header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ width: '52px', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {Array.from({ length: STEPS }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '36px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                  color: i === currentStep && isPlaying
                    ? '#ffffff'
                    : i % 4 === 0
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(255,255,255,0.1)',
                  fontWeight: i % 4 === 0 ? '600' : '400',
                  transition: 'color 0.05s',
                }}
              >
                {i % 4 === 0 ? i / 4 + 1 : '·'}
              </div>
            ))}
          </div>
        </div>

        {/* Grid rows */}
        {rows.map((row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '2px',
            }}
          >
            {/* Row label */}
            <div style={{
              width: '52px',
              flexShrink: 0,
              paddingRight: '12px',
              textAlign: 'right',
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isDrums ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)',
                fontWeight: isDrums ? '600' : '400',
              }}>
                {isDrums ? (DRUM_LABELS[row] || row) : row}
              </span>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {Array.from({ length: STEPS }, (_, step) => (
                <Step
                  key={step}
                  isActive={grid[row]?.[step] || false}
                  isBeat={step % 4 === 0}
                  isCurrent={step === currentStep && isPlaying}
                  isDrums={isDrums}
                  onClick={() => toggleNote(channel, row, step)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Playhead bar */}
        {isPlaying && currentStep >= 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ width: '52px', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {Array.from({ length: STEPS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: '36px',
                    height: '2px',
                    flexShrink: 0,
                    background: i === currentStep ? '#ffffff' : 'transparent',
                    transition: 'background 0.05s',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Step({ isActive, isBeat, isCurrent, isDrums, onClick }) {
  const [hov, setHov] = useState(false)

  let bg, border
  if (isActive) {
    bg = isDrums ? 'rgba(255,255,255,0.82)' : '#ffffff'
    border = '#ffffff'
  } else if (isCurrent) {
    bg = 'rgba(255,255,255,0.12)'
    border = 'rgba(255,255,255,0.28)'
  } else if (hov) {
    bg = 'rgba(255,255,255,0.08)'
    border = 'rgba(255,255,255,0.22)'
  } else if (isBeat) {
    bg = 'rgba(255,255,255,0.04)'
    border = 'rgba(255,255,255,0.13)'
  } else {
    bg = 'rgba(255,255,255,0.02)'
    border = 'rgba(255,255,255,0.07)'
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '36px',
        height: '32px',
        flexShrink: 0,
        background: bg,
        border: `1px solid ${border}`,
        cursor: 'pointer',
        transition: 'background 0.07s, border-color 0.07s',
        padding: 0,
      }}
    />
  )
}