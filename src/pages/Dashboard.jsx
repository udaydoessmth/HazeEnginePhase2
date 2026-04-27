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
    <div className="min-h-screen bg-bg pt-14">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-sans text-2xl font-400 mb-1">Projects</h1>
            <p className="font-mono text-xs text-text-muted">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="font-mono text-xs px-5 py-2.5 bg-text text-bg hover:bg-text-secondary transition-colors tracking-wider"
          >
            New Project
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <p className="font-mono text-xs text-text-muted animate-pulse">Loading projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="border border-border p-12 text-center">
            <p className="font-mono text-sm text-text-secondary mb-2">No projects yet</p>
            <p className="font-mono text-xs text-text-muted mb-6">
              Create your first visual novel to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="font-mono text-xs px-5 py-2.5 border border-border hover:border-border-hover transition-colors"
            >
              Create Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-bg p-6 hover:bg-bg-card transition-colors duration-200 group cursor-pointer"
                onClick={() => navigate(`/project/${project.id}/editor`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-mono text-sm font-bold truncate pr-4">{project.title}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/project/${project.id}/daw`)
                      }}
                      className="font-mono text-xs text-text-muted hover:text-text px-2 py-1 border border-border hover:border-border-hover transition-all"
                      title="Open DAW"
                    >
                      ♪
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(project.id)
                      }}
                      className="font-mono text-xs text-text-muted hover:text-error px-2 py-1 border border-border hover:border-error/30 transition-all"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="font-mono text-xs text-text-muted mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-dim">
                    {project.isPublished ? '● Published' : '○ Draft'}
                  </span>
                  <div className="flex items-center gap-2">
                    {project.isPublished && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/play/${project.id}`, '_blank')
                          }}
                          className="font-mono text-xs text-text-dim hover:text-text transition-colors opacity-0 group-hover:opacity-100"
                          title="Play"
                        >
                          ▶
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const url = `${window.location.origin}/play/${project.id}`
                            navigator.clipboard.writeText(url)
                            e.target.textContent = '✓'
                            setTimeout(() => { e.target.textContent = '⎘' }, 1500)
                          }}
                          className="font-mono text-xs text-text-dim hover:text-text transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy share link"
                        >
                          ⎘
                        </button>
                      </>
                    )}
                    <span className="font-mono text-xs text-text-dim">
                      {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-2">Project Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="My Visual Novel"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="font-mono text-xs px-4 py-2 text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="font-mono text-xs px-5 py-2 bg-text text-bg hover:bg-text-secondary transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Project">
        <div className="space-y-4">
          <p className="font-mono text-xs text-text-secondary">
            This will permanently delete this project and all its scenes. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="font-mono text-xs px-4 py-2 text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="font-mono text-xs px-5 py-2 bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
