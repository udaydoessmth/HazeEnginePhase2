/**
 * PublishModal.jsx
 * Shared modal for publishing a visual novel or music track.
 * Props:
 *   isOpen         – boolean
 *   onClose        – () => void
 *   type           – 'game' | 'music'
 *   defaultTitle   – prefill for the title field
 *   onPublish      – async ({ title, description, coverFile, genre, visibility }) => void
 *   publishing     – boolean (loading state)
 */
import { useState, useRef, useEffect } from 'react'

const GENRES_GAME = ['Romance', 'Mystery', 'Horror', 'Fantasy', 'Sci-Fi', 'Drama', 'Comedy', 'Action', 'Slice of Life', 'Other']
const GENRES_MUSIC = ['Electronic', 'Ambient', 'Lo-Fi', 'Jazz', 'Classical', 'Hip-Hop', 'Pop', 'Experimental', 'Other']

export default function PublishModal({ isOpen, onClose, type = 'game', defaultTitle = '', onPublish, publishing, publishError }) {
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const fileRef = useRef(null)

  // Sync title when default changes (e.g. project title loaded after open)
  useEffect(() => { setTitle(defaultTitle) }, [defaultTitle])

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle)
      setDescription('')
      setGenre('')
      setVisibility('public')
      setCoverFile(null)
      setCoverPreview(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const genres = type === 'game' ? GENRES_GAME : GENRES_MUSIC
  const label = type === 'game' ? 'Game' : 'Track'

  const handleCover = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    const reader = new FileReader()
    reader.onload = ev => setCoverPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    await onPublish({ title: title.trim(), description, genre, visibility, coverFile })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '36px',
          width: '100%',
          maxWidth: '480px',
          margin: '0 20px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Publish {label}
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
            Share your {type === 'game' ? 'visual novel' : 'music'} with the world
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cover Image */}
          <div>
            <FieldLabel>Cover Image</FieldLabel>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                height: '120px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: coverPreview ? 'transparent' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Click to upload
                </span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCover} style={{ display: 'none' }} />
          </div>

          {/* Title */}
          <div>
            <FieldLabel>{label} Title *</FieldLabel>
            <HazeInput
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'game' ? 'My Visual Novel' : 'My Track'}
            />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description..."
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '10px 12px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
                lineHeight: 1.6,
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Genre */}
          <div>
            <FieldLabel>Genre</FieldLabel>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                color: genre ? '#fff' : 'rgba(255,255,255,0.3)',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '10px 12px',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select genre</option>
              {genres.map(g => <option key={g} value={g} style={{ color: '#fff', background: '#111' }}>{g}</option>)}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <FieldLabel>Visibility</FieldLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['public', 'unlisted'].map(v => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '10px',
                    background: visibility === v ? '#fff' : 'transparent',
                    color: visibility === v ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${visibility === v ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: visibility === v ? '700' : '400',
                  }}
                >
                  {v === 'public' ? '🌍 Public' : '🔗 Unlisted'}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '8px', lineHeight: 1.5 }}>
              {visibility === 'public'
                ? 'Visible to everyone on the Explore page.'
                : 'Only accessible via direct link. Not shown on Explore.'}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            {publishError && (
              <p style={{
                fontFamily: 'monospace', fontSize: '10px', color: '#ff6666',
                letterSpacing: '0.05em', flex: 1, alignSelf: 'center', margin: 0,
              }}>
                ⚠ {publishError}
              </p>
            )}
            <button
              onClick={onClose}
              disabled={publishing}
              style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 18px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', cursor: publishing ? 'not-allowed' : 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => { if (!publishing) e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={publishing || !title.trim()}
              style={{
                fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '10px 24px',
                background: publishing || !title.trim() ? 'rgba(255,255,255,0.1)' : '#fff',
                color: publishing || !title.trim() ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
                border: 'none', cursor: publishing || !title.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '700', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!publishing && title.trim()) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {publishing ? 'Publishing...' : '↑ Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'monospace',
      fontSize: '10px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.4)',
      marginBottom: '8px',
    }}>
      {children}
    </label>
  )
}

function HazeInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '13px',
        padding: '10px 12px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
  )
}
