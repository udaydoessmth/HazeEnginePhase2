import { INSTRUMENT_PRESETS } from '../../audio/instruments'

export default function InstrumentPanel({ channel, currentInstrument, onInstrumentChange }) {
  const presets = INSTRUMENT_PRESETS[channel] || []

  if (channel === 'drums') {
    return (
      <div className="flex items-center border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-text-dim">Instrument: Standard Kit</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2">
      <span className="font-mono text-xs text-text-dim mr-1">Instrument:</span>
      {presets.map(preset => (
        <button
          key={preset.id}
          onClick={() => onInstrumentChange(channel, preset.id)}
          className={`font-mono text-xs px-2.5 py-1 border transition-all ${
            currentInstrument === preset.id
              ? 'border-text-secondary text-text-secondary'
              : 'border-border text-text-dim hover:border-border-hover hover:text-text-muted'
          }`}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
