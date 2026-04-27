import { useDawStore, NOTES } from '../../stores/dawStore'
import { SCALES_INFO } from '../../audio/instruments'

export default function TransportBar({
  isPlaying, tempo, isLooping, volume, scale, rootNote,
  onTogglePlay, onTempoChange, onToggleLoop, onVolumeChange,
}) {
  const { setScale, setRootNote } = useDawStore()

  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-2 flex-wrap">
      {/* Play/Stop */}
      <button
        onClick={onTogglePlay}
        className={`font-mono text-xs px-4 py-1.5 border transition-all ${
          isPlaying
            ? 'border-text text-text bg-bg-elevated'
            : 'border-border text-text-muted hover:border-border-hover hover:text-text'
        }`}
      >
        {isPlaying ? '■ Stop' : '▶ Play'}
      </button>

      {/* Loop */}
      <button
        onClick={onToggleLoop}
        className={`font-mono text-xs px-3 py-1.5 border transition-all ${
          isLooping
            ? 'border-text-secondary text-text-secondary'
            : 'border-border text-text-dim'
        }`}
      >
        ↻ Loop
      </button>

      <span className="text-text-dim">|</span>

      {/* Tempo */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-dim">BPM</span>
        <input
          type="number"
          value={tempo}
          onChange={e => onTempoChange(parseInt(e.target.value) || 120)}
          min={40}
          max={300}
          className="w-14 text-xs text-center py-1 px-1"
        />
      </div>

      <span className="text-text-dim">|</span>

      {/* Key */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-dim">Key</span>
        <select
          value={rootNote}
          onChange={e => setRootNote(e.target.value)}
          className="text-xs py-1 px-1 w-14"
        >
          {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Scale */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-text-dim">Scale</span>
        <select
          value={scale}
          onChange={e => setScale(e.target.value)}
          className="text-xs py-1 px-1 w-28"
        >
          {Object.entries(SCALES_INFO).map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="font-mono text-xs text-text-dim">Vol</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={e => onVolumeChange(parseInt(e.target.value) / 100)}
          className="w-20 accent-white"
        />
      </div>
    </div>
  )
}
