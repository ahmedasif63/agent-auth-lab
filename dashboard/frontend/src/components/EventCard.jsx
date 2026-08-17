import { AlertTriangle } from 'lucide-react'
import { getEventConfig } from '../config/eventTypes'
import { formatClockTime } from '../utils/time'

export default function EventCard({ event }) {
  const config = getEventConfig(event.type)
  const Icon = config.icon
  const isWarning = config.severity === 'warning'
  const isError = config.severity === 'error'

  let description
  try {
    description = config.description(event.data ?? {}, event.stage)
  } catch {
    description = 'Something happened, but this dashboard couldn’t describe it.'
  }

  const warningText =
    typeof config.warning === 'function'
      ? config.warning(event.data ?? {}, event.stage)
      : config.warning

  return (
    <div className="animate-fade-slide-in rounded-[var(--radius-control)] bg-white/80 shadow-[var(--shadow-control)] border border-[var(--color-hairline)] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${
            isWarning || isError
              ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
              : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
          }`}
        >
          <Icon size={14} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-[var(--color-ink)]">
              {config.label}
            </span>
            <span className="shrink-0 text-[11px] text-[var(--color-ink-faint)] tabular-nums">
              {formatClockTime(event.timestamp)}
            </span>
          </div>

          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            {description}
          </p>

          {isWarning && warningText && (
            <div className="mt-2.5 flex items-start gap-1.5 rounded-[10px] bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] px-3 py-2">
              <AlertTriangle
                size={13}
                strokeWidth={2}
                className="mt-[1px] shrink-0 text-[var(--color-warning)]"
              />
              <p className="text-[12px] leading-snug text-[var(--color-warning)]">
                {warningText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
