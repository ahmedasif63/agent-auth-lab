import { Activity, Waypoints } from 'lucide-react'

const VIEWS = [
  { id: 'live', label: 'Live', icon: Activity },
  { id: 'how', label: 'How this works', icon: Waypoints },
]

export default function ViewSwitcher({ view, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-black/[0.04] p-1">
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const isActive = view === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'bg-white text-[var(--color-ink)] shadow-[var(--shadow-control)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Icon size={14} strokeWidth={2} className={isActive ? 'text-[var(--color-accent)]' : ''} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
