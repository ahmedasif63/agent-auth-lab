import { User, Cpu, Server, Zap, FileCheck2, HelpCircle, AlertTriangle } from 'lucide-react'
import { STATUS_META, getStatusMeta } from '../utils/pipelineStatus'

// The only place this diagram hardcodes an icon choice, keyed by step id.
// pipelineSteps.js carries no styling, only content — a future stage adds a
// step by editing that config file alone. An id this map has never seen
// still renders something readable via the HelpCircle fallback below.
const STEP_ICONS = {
  'task-input': User,
  'agent-decides': Cpu,
  'tool-server-checks': Server,
  'action-executes': Zap,
  'result-logged': FileCheck2,
}

function getStepIcon(id) {
  return STEP_ICONS[id] ?? HelpCircle
}

export default function PipelineStep({
  step,
  isLast,
  nextStatus,
  isActive,
  isDimmed,
  onSelect,
  tokenRef,
}) {
  const meta = getStatusMeta(step.status)
  const isUnknownStatus = !(step.status in STATUS_META)
  const Icon = getStepIcon(step.id)
  const nextMeta = nextStatus ? getStatusMeta(nextStatus) : null

  return (
    <div className="flex items-stretch gap-5">
      <div className="flex w-11 shrink-0 flex-col items-center">
        <button
          ref={tokenRef}
          type="button"
          onClick={() => onSelect(step.id)}
          aria-label={step.title}
          className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 transition-transform duration-200 cursor-pointer ${meta.token} ${
            isActive ? 'scale-110' : ''
          }`}
        >
          <Icon size={18} strokeWidth={2} />
        </button>

        {!isLast && (
          <div
            className={`mt-1 w-0 flex-1 ${
              nextMeta.line.style === 'dashed'
                ? `border-l-2 border-dashed ${nextMeta.line.className}`
                : `border-l-2 border-solid ${nextMeta.line.className}`
            }`}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(step.id)}
        className={`min-w-0 flex-1 text-left rounded-[var(--radius-card)] border px-6 py-5 shadow-[var(--shadow-card)] transition-all duration-200 cursor-pointer ${meta.card} ${
          isLast ? 'mb-0' : 'mb-10'
        } ${isActive ? 'scale-[1.015] shadow-[0_0_0_3px_var(--color-accent-soft),var(--shadow-panel)]' : ''} ${
          isDimmed ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-[15px] font-semibold ${meta.title}`}>{step.title}</h3>
          {isUnknownStatus && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <AlertTriangle size={10} strokeWidth={2} />
              status: "{step.status}"
            </span>
          )}
        </div>

        <p className={`mt-1 text-[13.5px] leading-relaxed ${meta.body}`}>{step.description}</p>

        {step.status === 'planned' && (
          <span className="mt-2 inline-block text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
            Coming in a future stage
          </span>
        )}

        {step.vulnerabilityNote && (
          <div className="mt-3 flex items-start gap-1.5 rounded-[10px] bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] px-3 py-2">
            <AlertTriangle
              size={13}
              strokeWidth={2}
              className="mt-[1px] shrink-0 text-[var(--color-warning)]"
            />
            <p className="text-[12px] leading-snug text-[var(--color-warning)]">
              {step.vulnerabilityNote}
            </p>
          </div>
        )}
      </button>
    </div>
  )
}
