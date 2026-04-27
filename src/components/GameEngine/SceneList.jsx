import { useSceneStore } from '../../stores/sceneStore'

export default function SceneList() {
  const { scenes, activeSceneId, addScene, removeScene, setActiveScene, reorderScenes } = useSceneStore()

  return (
    <div className="w-52 bg-bg-card shrink-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="font-mono text-xs text-text-secondary">Scenes</span>
        <button
          onClick={addScene}
          className="font-mono text-xs text-text-muted hover:text-text px-2 py-0.5 border border-border hover:border-border-hover transition-all"
          title="Add Scene"
        >
          +
        </button>
      </div>

      {/* Scene Items */}
      <div className="flex-1 overflow-y-auto">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            onClick={() => setActiveScene(scene.id)}
            className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-border/50 group transition-colors ${
              activeSceneId === scene.id
                ? 'bg-bg-elevated text-text'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-text-dim shrink-0">{String(index + 1).padStart(2, '0')}</span>
              <span className="font-mono text-xs truncate">{scene.title}</span>
            </div>
            {scenes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeScene(scene.id)
                }}
                className="font-mono text-xs text-text-dim hover:text-error opacity-0 group-hover:opacity-100 transition-all ml-1"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Scene Count */}
      <div className="px-3 py-2 border-t border-border">
        <span className="font-mono text-xs text-text-dim">{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
