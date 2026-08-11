import { Square } from 'lucide-react'
import { formatRelativeTime } from '../utils/time'
import { getRunStatusMeta } from '../utils/runStatus'

export default function RunListItem({ run, isSelected, onSelect, onStop }) {
  const task = run.task?.trim() || '(no task recorded)'
  const statusMeta = getRunStatusMeta(run.status)
  const StatusIcon = statusMeta.icon
  const showStop = run.status === 'in_progress' && run.stoppable

  return (
    <div
      className={`group flex items-center gap-1 rounded-[var(--radius-control)] pr-1.5 transition-colors duration-150 ${
        isSelected ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-black/[0.03]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(run.run_id)}
        className="min-w-0 flex-1 text-left rounded-[var(--radius-control)] px-3.5 py-3 cursor-pointer"
      >
        <p
          className={`text-[13px] leading-snug line-clamp-2 ${
            isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
          }`}
        >
          {task}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--color-ink-muted)]">
          <StatusIcon
            size={12}
            strokeWidth={2}
            className={`${statusMeta.className} ${statusMeta.spin ? 'animate-spin' : ''}`}
          />
          <span className={statusMeta.className}>{statusMeta.label}</span>
          <span className="text-[var(--color-ink-faint)]">·</span>
          <span>{formatRelativeTime(run.start_timestamp)}</span>
        </div>
      </button>

      {showStop && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onStop(run.run_id)
          }}
          aria-label="Stop run"
          title="Stop run"
          className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-warning-soft)] hover:text-[var(--color-warning)] transition-all duration-150 cursor-pointer"
        >
          <Square size={11} strokeWidth={2} fill="currentColor" />
        </button>
      )}
    </div>
  )
}
