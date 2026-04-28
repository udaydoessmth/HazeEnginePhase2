import { useDawStore } from '../../stores/dawStore'
import { CHANNEL_INFO } from '../../audio/instruments'

export default function ChannelSelector({ activeChannel }) {
  const { setActiveChannel, clearPattern } = useDawStore()

  return (
    <div className="flex items-center border-b border-border px-4 py-2 gap-2">
      <span className="font-mono text-xs text-text-dim mr-2">Channel:</span>
      {Object.entries(CHANNEL_INFO).map(([key, info]) => (
        <button
          key={key}
          onClick={() => setActiveChannel(key)}
          className={`font-mono text-xs px-3 py-1.5 border transition-all ${activeChannel === key
              ? 'border-text text-text bg-bg-elevated'
              : 'border-border text-text-muted hover:border-border-hover hover:text-text'
            }`}
        >
          {info.label}
        </button>
      ))}
      <div className="ml-auto">
        <button
          onClick={() => clearPattern(activeChannel)}
          className="font-mono text-xs px-3 py-1.5 text-text-dim hover:text-error border border-border hover:border-error/30 transition-all"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
