export default function Modal({ isOpen, onClose, title, children, maxWidth = '480px' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative bg-bg-card border border-border animate-scale-in w-full"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-mono text-sm font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
