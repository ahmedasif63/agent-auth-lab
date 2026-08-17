import { FileBadge2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

function Workload({ name, role }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-hairline)] bg-white text-[var(--color-accent)] shadow-[var(--shadow-control)]">
        <FileBadge2 size={24} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[var(--color-ink)]">{name}</p>
        <p className="text-[11px] text-[var(--color-ink-faint)]">{role}</p>
      </div>
    </div>
  )
}

// The literal shape of "mutual": two arrows, not one. A normal HTTPS site
// only draws the top arrow (server proves itself to the browser). Stage 1
// draws both — each side shows a certificate to the other before either
// sends a byte of the real request.
export default function Stage1MutualTLSDiagram() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[var(--radius-card)] border border-[var(--color-hairline)] bg-white/60 px-6 py-7 sm:flex-row sm:justify-center sm:gap-6">
      <Workload name="agent.py" role="proves it is agent.py" />

      <div className="flex w-full flex-col items-center gap-1.5 sm:w-36">
        <div className="flex w-full items-center gap-1.5 text-[var(--color-ink-faint)]">
          <span className="h-px flex-1 bg-[var(--color-hairline)]" />
          <ArrowRight size={13} strokeWidth={2} />
        </div>
        <span className="text-center text-[10px] leading-tight text-[var(--color-ink-faint)]">
          both show a certificate
        </span>
        <div className="flex w-full items-center gap-1.5 text-[var(--color-ink-faint)]">
          <ArrowLeft size={13} strokeWidth={2} />
          <span className="h-px flex-1 bg-[var(--color-hairline)]" />
        </div>
        <div className="mt-1 flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-accent)]">
          <CheckCircle2 size={12} strokeWidth={2} />
          both verified
        </div>
      </div>

      <Workload name="server.py" role="proves it is server.py" />
    </div>
  )
}
