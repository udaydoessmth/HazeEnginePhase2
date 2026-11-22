/**
 * PublishSuccessBanner.jsx
 * Shows a dismissible success banner after a successful publish.
 * Props: url (string), onDismiss () => void, type ('game'|'music')
 */
export default function PublishSuccessBanner({ url, onDismiss, type = 'game' }) {
  if (!url) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => {})
    const btn = document.getElementById('pub-copy-btn')
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Link' }, 2000) }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#111',
      border: '1px solid rgba(255,255,255,0.2)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      zIndex: 300,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
      maxWidth: 'calc(100vw - 48px)',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#fff', letterSpacing: '0.05em' }}>
        ✓ {type === 'game' ? 'Game' : 'Track'} published
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
        {url}
      </span>
      <button id="pub-copy-btn" onClick={handleCopy} style={btnStyle}>Copy Link</button>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, textDecoration: 'none', color: 'rgba(255,255,255,0.5)' }}>
        Open ↗
      </a>
      <button onClick={onDismiss} style={{ ...btnStyle, color: 'rgba(255,255,255,0.3)', fontSize: '14px', padding: '0 4px' }}>×</button>
    </div>
  )
}

const btnStyle = {
  fontFamily: 'monospace',
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  padding: '6px 12px',
  transition: 'all 0.15s',
  flexShrink: 0,
}
