// The only place this app hardcodes a color per pipeline-step status. Keyed
// by the `status` value from src/config/pipelineSteps.js — add a stage with
// a new status here (never in a component) if one is ever introduced.
export const STATUS_META = {
  solved: {
    legendLabel: 'Working as intended',
    line: { style: 'solid', className: 'bg-[var(--color-hairline)]' },
    token: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] ring-[var(--color-accent)]/20',
    card: 'bg-white/80 border-[var(--color-hairline)]',
    title: 'text-[var(--color-ink)]',
    body: 'text-[var(--color-ink-muted)]',
    legendDot: 'bg-[var(--color-ink-faint)]',
  },
  vulnerable: {
    legendLabel: 'Vulnerability',
    line: { style: 'solid', className: 'bg-[var(--color-warning)]' },
    token: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] ring-[var(--color-warning)]/25',
    card: 'bg-[var(--color-warning-soft)]/60 border-[var(--color-warning-border)]',
    title: 'text-[var(--color-ink)]',
    body: 'text-[var(--color-ink-muted)]',
    legendDot: 'bg-[var(--color-warning)]',
  },
  planned: {
    legendLabel: 'Not built yet',
    line: { style: 'dashed', className: 'border-[var(--color-ink-faint)]' },
    token: 'bg-black/[0.04] text-[var(--color-ink-faint)] ring-[var(--color-ink-faint)]/25',
    card: 'bg-white/40 border-dashed border-[var(--color-ink-faint)]',
    title: 'text-[var(--color-ink-faint)]',
    body: 'text-[var(--color-ink-faint)]',
    legendDot: 'border-2 border-dashed border-[var(--color-ink-faint)] bg-transparent',
  },
}

// Shown for any status value pipelineSteps.js uses that isn't registered
// above yet — a visibly "something needs updating here" look rather than a
// silent crash or a state that quietly passes as one of the real three.
export const UNKNOWN_STATUS_META = {
  legendLabel: 'Unknown status — needs a style',
  line: { style: 'solid', className: 'bg-amber-400' },
  token: 'bg-amber-100 text-amber-700 ring-amber-400/40',
  card: 'bg-amber-50 border-amber-300',
  title: 'text-amber-900',
  body: 'text-amber-700',
  legendDot: 'bg-amber-500',
}

export function getStatusMeta(status) {
  return STATUS_META[status] ?? UNKNOWN_STATUS_META
}
