import { Infinity as InfinityIcon, TimerReset, ArrowRight } from 'lucide-react'

function Chip({ icon: Icon, label, sublabel, tone }) {
  const isBefore = tone === 'before'
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
        isBefore ? 'border-[var(--color-hairline)] bg-white/60' : 'border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)]'
      }`}
    >
      <Icon
        size={14}
        strokeWidth={2}
        className={isBefore ? 'text-[var(--color-ink-faint)]' : 'text-[var(--color-accent)]'}
      />
      <div className="leading-tight">
        <p className={`text-[11px] font-semibold ${isBefore ? 'text-[var(--color-ink-muted)]' : 'text-[var(--color-accent)]'}`}>
          {label}
        </p>
        <p className="text-[9.5px] text-[var(--color-ink-faint)]">{sublabel}</p>
      </div>
    </div>
  )
}

// A one-glance version of the same before/after pattern used in "What
// changed": Stage 0's key never expired (infinity), Stage 1's identity
// expires in 180 seconds (a timer). Sits next to the live countdown panel
// so the reader sees the real number right beside what it's being compared
// against.
export default function Stage1TTLCompare() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip icon={InfinityIcon} label="Stage 0" sublabel="valid forever" tone="before" />
      <ArrowRight size={13} strokeWidth={2} className="text-[var(--color-ink-faint)]" />
      <Chip icon={TimerReset} label="Stage 1" sublabel="180 seconds" tone="after" />
    </div>
  )
}
