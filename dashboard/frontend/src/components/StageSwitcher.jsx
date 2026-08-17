const STAGES = [
  { id: 'stage-0', label: 'Stage 0' },
  { id: 'stage-1', label: 'Stage 1' },
]

// Chooses which stage's agent+server pair POST /trigger targets, and which
// stage's "How this works" explainer is shown. Lives in the header (visible
// from both views) rather than only beside the task input, since it also
// drives the How This Works view.
export default function StageSwitcher({ stage, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-black/[0.04] p-0.5">
      {STAGES.map(({ id, label }) => {
        const isActive = stage === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'bg-white text-[var(--color-ink)] shadow-[var(--shadow-control)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
