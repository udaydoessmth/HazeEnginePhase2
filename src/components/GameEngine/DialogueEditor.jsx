import { useSceneStore } from '../../stores/sceneStore'

export default function DialogueEditor({ scene }) {
  const { addDialogue, updateDialogue, removeDialogue } = useSceneStore()

  return (
    <div className="space-y-3">
      {scene.dialogues.map((dialogue, index) => (
        <div key={dialogue.id} className="border border-border p-3 group hover:border-border-hover transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-text-dim">{String(index + 1).padStart(2, '0')}</span>
            <button
              onClick={() => removeDialogue(scene.id, dialogue.id)}
              className="font-mono text-xs text-text-dim hover:text-error opacity-0 group-hover:opacity-100 transition-all"
            >
              Remove
            </button>
          </div>

          <div className="space-y-2">
            <input
              value={dialogue.characterName}
              onChange={e => updateDialogue(scene.id, dialogue.id, { characterName: e.target.value })}
              placeholder="Character name"
              className="w-full text-xs bg-bg-input border-border"
            />
            <textarea
              value={dialogue.text}
              onChange={e => updateDialogue(scene.id, dialogue.id, { text: e.target.value })}
              placeholder="Write dialogue text..."
              rows={2}
              className="w-full text-xs bg-bg-input border-border resize-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      ))}

      <button
        onClick={() => addDialogue(scene.id)}
        className="w-full font-mono text-xs py-2.5 border border-dashed border-border hover:border-border-hover text-text-muted hover:text-text transition-all"
      >
        + Add Dialogue
      </button>
    </div>
  )
}
