import { stage0RequestFlow, stage1RequestFlow } from '../config/stage1Boundary'

function StepNode({ step, isLast, nextState }) {
  const Icon = step.icon
  const unreached = step.state === 'unreached'
  const stop = step.state === 'stop'
  const dashedConnector = unreached || nextState === 'unreached'

  return (
    <div className="flex items-center">
      <div className={`flex w-[90px] shrink-0 flex-col items-center gap-1.5 ${unreached ? 'opacity-40' : ''}`}>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full border ${
            stop
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : unreached
                ? 'border-dashed border-[var(--color-ink-faint)] text-[var(--color-ink-faint)]'
                : 'border-[var(--color-hairline)] bg-white text-[var(--color-ink-muted)]'
          }`}
        >
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <span
          className={`text-center text-[10.5px] leading-tight ${
            stop ? 'font-semibold text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'
          }`}
        >
          {step.label}
        </span>
      </div>

      {!isLast && (
        <div
          className={`mx-0.5 h-px w-6 shrink-0 ${
            dashedConnector
              ? 'border-t border-dashed border-[var(--color-ink-faint)]'
              : 'bg-[var(--color-hairline)]'
          }`}
        />
      )}
    </div>
  )
}

function FlowRow({ flow, accent }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-hairline)] bg-white/60 px-5 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            accent ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink-faint)]'
          }`}
        >
          {flow.label}
        </span>
        <span className="text-[11.5px] text-[var(--color-ink-muted)]">{flow.outcome}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {flow.steps.map((step, idx) => (
          <StepNode
            key={step.id}
            step={step}
            isLast={idx === flow.steps.length - 1}
            nextState={flow.steps[idx + 1]?.state}
          />
        ))}
      </div>
    </div>
  )
}

// The two request paths as diagrams, not prose: same visual language for
// both rows (a line of steps, a stop marker, a faded step for what never
// happens) so the only thing that differs is where each path actually
// stops. Stage 0's request reaches the application and gets turned away
// from inside it; Stage 1's never gets past the TLS handshake.
export default function Stage1BoundaryFlow() {
  return (
    <div className="flex flex-col gap-3">
      <FlowRow flow={stage0RequestFlow} accent={false} />
      <FlowRow flow={stage1RequestFlow} accent />
    </div>
  )
}
