import { useDawStore, STEPS } from '../../stores/dawStore'

export default function StepSequencer({ channel, currentStep, isPlaying }) {
  const { patterns, toggleNote } = useDawStore()
  const pattern = patterns[channel]

  if (!pattern) return <div className="p-4 font-mono text-xs text-text-muted">Loading pattern...</div>

  const { grid, rows } = pattern
  const isDrums = channel === 'drums'

  const drumLabels = {
    kick: 'KCK',
    snare: 'SNR',
    hihat: 'HHT',
    rimshot: 'RIM',
  }

  return (
    <div className="p-4 select-none">
      <div className="inline-block min-w-fit">
        {/* Step numbers header */}
        <div className="flex items-center mb-1">
          <div className="w-16 shrink-0" />
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className={`w-10 h-5 flex items-center justify-center font-mono text-xs shrink-0 ${
                i === currentStep && isPlaying ? 'text-text' : 'text-text-muted'
              }`}
            >
              {i % 4 === 0 ? i / 4 + 1 : '·'}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {rows.map((row) => (
          <div key={row} className="flex items-center group">
            {/* Row label */}
            <div className="w-16 shrink-0 pr-2 text-right">
              <span className={`font-mono text-xs ${
                isDrums ? 'text-text-secondary' : 'text-text-muted'
              }`}>
                {isDrums ? drumLabels[row] || row : row}
              </span>
            </div>

            {/* Steps */}
            {Array.from({ length: STEPS }, (_, step) => {
              const isActive = grid[row]?.[step] || false
              const isBeatLine = step % 4 === 0
              const isCurrentBeat = step === currentStep && isPlaying

              return (
                <button
                  key={step}
                  onClick={() => toggleNote(channel, row, step)}
                  className="w-10 h-8 shrink-0 transition-all duration-75"
                  style={{
                    backgroundColor: isActive
                      ? (isDrums ? '#999' : '#fff')
                      : isCurrentBeat
                        ? '#1e1e1e'
                        : (isBeatLine ? '#151515' : '#111'),
                    border: `1px solid ${isActive ? '#666' : '#222'}`,
                    borderLeftWidth: isBeatLine ? '2px' : '1px',
                    borderLeftColor: isBeatLine ? '#333' : '#222',
                  }}
                />
              )
            })}
          </div>
        ))}

        {/* Playhead indicator */}
        {isPlaying && currentStep >= 0 && (
          <div className="flex items-center mt-1">
            <div className="w-16 shrink-0" />
            {Array.from({ length: STEPS }, (_, i) => (
              <div
                key={i}
                className="w-10 h-1.5 shrink-0 transition-colors duration-75"
                style={{
                  backgroundColor: i === currentStep ? '#fff' : 'transparent',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
