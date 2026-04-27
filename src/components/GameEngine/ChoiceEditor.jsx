import { useSceneStore } from '../../stores/sceneStore'

export default function ChoiceEditor({ scene, scenes }) {
  const { addChoice, updateChoice, removeChoice } = useSceneStore()

  return (
    <div className="space-y-3">
      {scene.choices.map((choice, index) => (
        <div key={choice.id} className="border border-border p-3 group hover:border-border-hover transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-text-dim">Choice {index + 1}</span>
            <button
              onClick={() => removeChoice(scene.id, choice.id)}
              className="font-mono text-xs text-text-dim hover:text-error opacity-0 group-hover:opacity-100 transition-all"
            >
              Remove
            </button>
          </div>

          <div className="space-y-2">
            <input
              value={choice.text}
              onChange={e => updateChoice(scene.id, choice.id, { text: e.target.value })}
              placeholder="Choice text (e.g. 'Go left')"
              className="w-full text-xs"
            />
            <div>
              <label className="block font-mono text-xs text-text-dim mb-1">Goes to scene:</label>
              <select
                value={choice.targetSceneId || ''}
                onChange={e => updateChoice(scene.id, choice.id, { targetSceneId: e.target.value || null })}
                className="w-full text-xs"
              >
                <option value="">— Select scene —</option>
                {scenes.filter(s => s.id !== scene.id).map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => addChoice(scene.id)}
        className="w-full font-mono text-xs py-2.5 border border-dashed border-border hover:border-border-hover text-text-muted hover:text-text transition-all"
      >
        + Add Choice
      </button>

      {scene.choices.length === 0 && (
        <p className="font-mono text-xs text-text-dim">
          No choices means the scene continues to the next scene in order, or ends the game.
        </p>
      )}
    </div>
  )
}
