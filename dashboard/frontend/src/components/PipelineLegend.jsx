import { AlertTriangle } from 'lucide-react'
import { STATUS_META } from '../utils/pipelineStatus'

// Fixed order for the three statuses pipelineSteps.js is documented to use.
// Anything else found in the actual data gets called out separately below,
// rather than silently reusing one of these three entries.
const KNOWN_STATUS_ORDER = ['solved', 'vulnerable', 'planned']

export default function PipelineLegend({ pipelineSteps }) {
  const unknownStatuses = [
    ...new Set(
      pipelineSteps.map((step) => step.status).filter((status) => !(status in STATUS_META)),
    ),
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {KNOWN_STATUS_ORDER.map((status) => (
        <div key={status} className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_META[status].legendDot}`} />
          <span className="text-[12.5px] text-[var(--color-ink-muted)]">
            {STATUS_META[status].legendLabel}
          </span>
        </div>
      ))}

      {unknownStatuses.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1">
          <AlertTriangle size={12} strokeWidth={2} className="text-amber-700" />
          <span className="text-[12px] font-medium text-amber-700">
            {unknownStatuses.length === 1
              ? `Unrecognized status "${unknownStatuses[0]}" in pipelineSteps.js — add it to STATUS_META.`
              : `Unrecognized statuses in pipelineSteps.js: ${unknownStatuses
                  .map((s) => `"${s}"`)
                  .join(', ')} — add them to STATUS_META.`}
          </span>
        </div>
      )}
    </div>
  )
}
