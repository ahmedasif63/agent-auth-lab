import { KeyRound, Ban, FileBadge2, ArrowRight } from 'lucide-react'

const STAGE_0 = {
  badge: 'Stage 0',
  icon: KeyRound,
  title: 'One shared password',
  points: [
    'Typed into both processes ahead of time',
    'Valid forever, for anyone who has it',
    'One leak compromises everything, permanently',
  ],
}

const STAGE_1 = {
  badge: 'Stage 1',
  icon: FileBadge2,
  title: 'A certificate per process',
  points: [
    'Issued automatically the moment it starts',
    'Expires in minutes, not forever',
    'Never typed, stored, or copy-pasted anywhere',
  ],
}

function ComparisonCard({ data, tone }) {
  const Icon = data.icon
  const isBefore = tone === 'before'

  return (
    <div
      className={`flex-1 rounded-[var(--radius-card)] border px-6 py-6 ${
        isBefore
          ? 'border-[var(--color-hairline)] bg-white/60'
          : 'border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]/50'
      }`}
    >
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          isBefore ? 'bg-black/[0.05] text-[var(--color-ink-faint)]' : 'bg-[var(--color-accent)] text-white'
        }`}
      >
        {data.badge}
      </span>

      <div className="mt-4 flex items-center gap-3">
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            isBefore ? 'bg-black/[0.04] text-[var(--color-ink-faint)]' : 'bg-white text-[var(--color-accent)]'
          }`}
        >
          <Icon size={21} strokeWidth={1.75} />
          {isBefore && (
            <Ban
              size={38}
              strokeWidth={1.25}
              className="absolute text-[var(--color-warning)] opacity-60"
            />
          )}
        </div>
        <p className="text-[15px] font-semibold text-[var(--color-ink)]">{data.title}</p>
      </div>

      <ul className="mt-4 flex flex-col gap-1.5">
        {data.points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--color-ink-muted)]"
          >
            <span
              className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${
                isBefore ? 'bg-[var(--color-ink-faint)]' : 'bg-[var(--color-accent)]'
              }`}
            />
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}

// The literal difference, shown rather than described: a struck-through key
// icon (a password that got typed into both sides once, ahead of time) next
// to a certificate icon (issued fresh, per process, per run). Same data
// either way — this is just making the contrast visible at a glance instead
// of stating it in a paragraph.
export default function Stage1KeyVsCert() {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <ComparisonCard data={STAGE_0} tone="before" />
      <ArrowRight
        size={18}
        strokeWidth={2}
        className="hidden shrink-0 text-[var(--color-ink-faint)] sm:block"
      />
      <ComparisonCard data={STAGE_1} tone="after" />
    </div>
  )
}
