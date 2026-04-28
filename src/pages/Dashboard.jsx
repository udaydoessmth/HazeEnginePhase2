import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import Modal from '../components/ui/Modal'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const project = await createProject(newTitle.trim())
    if (project) {
      setShowCreate(false)
      setNewTitle('')
      navigate(`/project/${project.id}/editor`)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProject(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      paddingTop: '56px',
      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    }}>
      {/* Subtle radial ambient */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '64px 40px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '64px',
        }}>
          <div>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.4)',
              }} />
              Your Projects
            </p>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              {loading ? 'Loading...' : projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
            </h1>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '12px 24px',
              background: '#ffffff',
              color: '#0a0a0a',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            New Project
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '96px 0' }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              Loading projects...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div style={{
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '80px 40px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '32px',
            }}>
              Create your first visual novel to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }}
            >
              Create Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1px',
            background: 'rgba(255,255,255,0.06)',
          }}>
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => navigate(`/project/${project.id}/editor`)}
                onDaw={() => navigate(`/project/${project.id}/daw`)}
                onDelete={() => setDeleteId(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <HazeModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '10px',
            }}>Project Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="My Visual Novel"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '13px',
                padding: '12px 14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setShowCreate(false)}
              style={ghostBtnStyle}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >Cancel</button>
            <button
              onClick={handleCreate}
              style={primaryBtnStyle}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >Create</button>
          </div>
        </div>
      </HazeModal>

      {/* Delete Modal */}
      <HazeModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Project">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            This will permanently delete this project and all its scenes. This cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setDeleteId(null)}
              style={ghostBtnStyle}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >Cancel</button>
            <button
              onClick={handleDelete}
              style={{
                ...primaryBtnStyle,
                background: 'transparent',
                color: '#ff4444',
                border: '1px solid rgba(255,68,68,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >Delete</button>
          </div>
        </div>
      </HazeModal>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>
    </div>
  )
}

function ProjectCard({ project, onOpen, onDaw, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#111111' : '#0a0a0a',
        padding: '28px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        position: 'relative',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <h3 style={{
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          fontSize: '15px',
          fontWeight: '600',
          color: '#ffffff',
          margin: 0,
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}>{project.title}</h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}>
          <IconBtn
            onClick={(e) => { e.stopPropagation(); onDaw() }}
            title="Open DAW"
            label="♪"
          />
          <IconBtn
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete"
            label="×"
            danger
          />
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        margin: '12px 0',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {project.description || 'No description'}
      </p>

      {/* Bottom row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: project.isPublished ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            display: 'inline-block',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: project.isPublished ? 'rgba(255,255,255,0.6)' : 'transparent',
            border: project.isPublished ? 'none' : '1px solid rgba(255,255,255,0.25)',
          }} />
          {project.isPublished ? 'Published' : 'Draft'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {project.isPublished && hovered && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(`/play/${project.id}`, '_blank') }}
                title="Play"
                style={inlineLinkStyle}
              >▶</button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const url = `${window.location.origin}/play/${project.id}`
                  navigator.clipboard.writeText(url)
                  e.target.textContent = '✓'
                  setTimeout(() => { e.target.textContent = '⎘' }, 1500)
                }}
                title="Copy share link"
                style={inlineLinkStyle}
              >⎘</button>
            </>
          )}
          <span style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ onClick, title, label, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: 'monospace',
        fontSize: '13px',
        padding: '4px 8px',
        background: 'transparent',
        border: `1px solid ${hov ? (danger ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.25)') : 'rgba(255,255,255,0.1)'}`,
        color: hov ? (danger ? '#ff4444' : '#fff') : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        lineHeight: 1,
      }}
    >{label}</button>
  )
}

function HazeModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '32px',
          width: '100%',
          maxWidth: '420px',
          margin: '0 20px',
        }}
      >
        <h2 style={{
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          fontSize: '16px',
          fontWeight: '600',
          color: '#fff',
          margin: '0 0 24px',
          letterSpacing: '-0.01em',
        }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

const ghostBtnStyle = {
  fontFamily: 'monospace',
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '10px 18px',
  background: 'transparent',
  color: 'rgba(255,255,255,0.4)',
  border: 'none',
  cursor: 'pointer',
  transition: 'color 0.15s',
}

const primaryBtnStyle = {
  fontFamily: 'monospace',
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '10px 20px',
  background: '#ffffff',
  color: '#0a0a0a',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'opacity 0.15s',
}

const inlineLinkStyle = {
  fontFamily: 'monospace',
  fontSize: '11px',
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.35)',
  cursor: 'pointer',
  padding: 0,
  transition: 'color 0.15s',
}