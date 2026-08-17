import { stage1IssuanceChain } from '../config/stage1Chain'
import Reveal from './Reveal'

// Renders purely by mapping over stage1IssuanceChain — a horizontal
// architecture diagram, intentionally distinct from PipelineDiagram's
// vertical connected-line-of-steps, since this represents a trust
// hierarchy, not a sequence of steps in a single request. This is the
// central idea of the page (see Stage1View's hero wrapper around this
// section), so it's sized and detailed to visually dominate: larger cards,
// numbered steps, and each card revealing in sequence left to right instead
// of all at once, echoing the identity actually being handed down the
// chain. flex-wrap instead of horizontal scroll: on any viewport too
// narrow to fit the whole chain in one row, cards wrap to a second row so
// every step stays visible at once rather than being scrolled off-screen.
export default function Stage1IssuanceChain() {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-y-4 gap-x-1">
      {stage1IssuanceChain.map((node, idx) => {
        const Icon = node.icon
        const isLast = idx === stage1IssuanceChain.length - 1

        return (
          // items-stretch (not items-center) so the card fills the full
          // height of this row cell — every card's top and bottom edge
          // lines up with its neighbors even when descriptions differ in
          // length, rather than shorter cards floating centered next to
          // taller ones. The connector opts back out with self-center so
          // it still sits at the card's vertical midpoint.
          <div key={node.id} className="flex items-stretch">
            <Reveal delay={idx * 130} className="w-72 shrink-0">
              <div className="relative h-full rounded-[var(--radius-card)] bg-white border border-[var(--color-hairline)] shadow-[var(--shadow-panel)] px-6 py-6">
                <span className="absolute -top-2.5 -left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10.5px] font-semibold text-white shadow-[var(--shadow-control)]">
                  {idx + 1}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <Icon size={21} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15.5px] font-semibold text-[var(--color-ink)]">
                      {node.title}
                    </p>
                    <p className="text-[11.5px] text-[var(--color-ink-faint)]">{node.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--color-ink-muted)]">
                  {node.description}
                </p>
              </div>
            </Reveal>

            {!isLast && (
              <div className="relative self-center mx-1 h-px w-10 shrink-0 sm:w-14">
                <div className="absolute inset-0 bg-[var(--color-hairline)]" />
                <span
                  className="animate-travel-right absolute h-2 w-2 rounded-full bg-[var(--color-accent)]"
                  style={{ top: '-3.5px', boxShadow: '0 0 8px rgba(0, 113, 227, 0.7)', animationDelay: `${idx * 1.2}s` }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
