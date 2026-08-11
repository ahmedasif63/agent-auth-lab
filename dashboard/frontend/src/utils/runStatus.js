import { CheckCircle2, Loader2, XCircle, Square, HelpCircle } from 'lucide-react'

// The single lookup for how a run's overall status (from GET /runs'
// `status` field) renders — icon, label, color. Keyed by status string so
// RunListItem and the Live view's own status readout stay in sync.
//
// 'unknown' means the backend has no terminal event for this run AND isn't
// currently tracking its process (e.g. it was started by hand, outside
// /trigger) — its real state genuinely can't be determined, which is why
// it's kept visually distinct from 'in_progress' rather than implying
// something is actively running.
export const RUN_STATUS_META = {
  complete: { icon: CheckCircle2, label: 'Complete', className: 'text-[var(--color-success)]' },
  in_progress: {
    icon: Loader2,
    label: 'In progress',
    className: 'text-[var(--color-accent)]',
    spin: true,
  },
  failed: { icon: XCircle, label: 'Failed', className: 'text-[var(--color-warning)]' },
  stopped: { icon: Square, label: 'Stopped', className: 'text-[var(--color-ink-muted)]' },
  unknown: { icon: HelpCircle, label: 'Not tracked', className: 'text-[var(--color-ink-faint)]' },
}

// Fallback for any status value not registered above — shown the same way
// as 'unknown' rather than misleadingly implying an active run.
export function getRunStatusMeta(status) {
  return RUN_STATUS_META[status] ?? RUN_STATUS_META.unknown
}
