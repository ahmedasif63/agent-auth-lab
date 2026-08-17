import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import EventCard from './EventCard'
import { formatClockTime } from '../utils/time'

const RING_SIZE = 56
const RING_STROKE = 5

// Kept in sync with Stage1UnauthDemo's CARD_HEIGHT_CLASS so the two cards
// stay the same static height next to each other when they're shown side
// by side (LiveView's fixedHeight usage). Tall enough that
// Stage1UnauthDemo's terminal (command line, connection result, and detail
// text — a bounded amount of content, never a growing log) fits without
// ever needing to scroll. This panel's own "Show all" history is the one
// exception that can still exceed it, so that section alone scrolls
// internally.
export const CARD_HEIGHT_CLASS = 'h-80'

function CountdownRing({ fraction, justRefreshed, centerLabel }) {
  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, fraction))
  const offset = circumference * (1 - clamped)

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        className={`-rotate-90 ${justRefreshed ? 'animate-ring-pulse' : ''}`}
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
          {centerLabel}
        </span>
      </div>
    </div>
  )
}

// The headline live feature, kept deliberately small so it reads as a
// status strip, not a hero section: a countdown ring for the real 180
// second SPIRE TTL (see stage1_status.py for why this is an estimate, not
// a confirmed reissue signal), a small row of recent check-in pills, and
// the full history one click away.
//
// `fixedHeight` is opt-in: LiveView pairs this card with Stage1UnauthDemo
// side by side and needs both to match height exactly (CARD_HEIGHT_CLASS,
// header fixed, check-ins area scrolling internally). Stage1View shows it
// alone in a full-width prose column, where a tall fixed height would just
// be empty space — there it grows naturally with its content instead.
export default function Stage1RotationPanel({ status, now, className, fixedHeight = false }) {
  const server = status?.stage1_server
  const [showAll, setShowAll] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)
  const prevLastRefreshRef = useRef(null)

  useEffect(() => {
    const current = server?.last_refresh_at
    if (current == null) return
    const prev = prevLastRefreshRef.current
    prevLastRefreshRef.current = current
    if (prev != null && current !== prev) {
      setJustRefreshed(true)
      const timeoutId = setTimeout(() => setJustRefreshed(false), 700)
      return () => clearTimeout(timeoutId)
    }
  }, [server?.last_refresh_at])

  if (!server?.tracked) {
    return (
      <div className={`${fixedHeight ? `${CARD_HEIGHT_CLASS} flex items-center` : ''} rounded-[var(--radius-control)] bg-white/70 border border-[var(--color-hairline)] px-4 py-3 ${className ?? ''}`}>
        <p className="text-[12.5px] text-[var(--color-ink-muted)]">
          Waiting for stage1-server's first check-in.
        </p>
      </div>
    )
  }

  const ttlSeconds = server.svid_ttl_seconds ?? 180
  const secondsSinceCheckin = server.last_refresh_at != null
    ? Math.max(0, now / 1000 - server.last_refresh_at)
    : 0
  const ttlSecondsRemaining = Math.max(0, ttlSeconds - secondsSinceCheckin)
  const ttlFraction = ttlSeconds ? ttlSecondsRemaining / ttlSeconds : 0
  const ttlLabel = ttlSecondsRemaining <= 0.5 ? '0s' : `${Math.ceil(ttlSecondsRemaining)}s`

  const nextCheckinSeconds = server.next_refresh_estimate_at != null
    ? Math.max(0, server.next_refresh_estimate_at - now / 1000)
    : null

  const newestFirst = [...server.recent_refreshes].sort((a, b) => b.timestamp - a.timestamp)
  const compact = newestFirst.slice(0, 4)

  return (
    <div className={`${fixedHeight ? `${CARD_HEIGHT_CLASS} flex flex-col` : ''} rounded-[var(--radius-control)] bg-white/80 border border-[var(--color-hairline)] shadow-[var(--shadow-control)] px-4 py-3.5 ${className ?? ''}`}>
      <div className="shrink-0">
        <p className="text-[12.5px] font-semibold text-[var(--color-ink)]">
          Identity Certificate Reset
        </p>
        <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">
          Time until stage1-server's SPIRE identity is reissued (estimate).
        </p>
      </div>

      <div className={`mt-3 flex flex-col ${fixedHeight ? 'min-h-0 flex-1 overflow-y-auto' : ''}`}>
        <div className="flex items-center gap-3">
          <CountdownRing fraction={ttlFraction} justRefreshed={justRefreshed} centerLabel={ttlLabel} />
          <p className="text-[11px] leading-snug text-[var(--color-ink-faint)]">
            Up to {ttlSeconds}s per the SPIRE TTL, from stage1-server's last
            check-in.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-hairline)] pt-2.5">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
            Check-ins
          </span>
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {compact.map((event, idx) => (
              <span
                key={event.timestamp}
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] tabular-nums text-[var(--color-ink-muted)] transition-colors duration-300 ${
                  idx === 0 && justRefreshed
                    ? 'animate-fade-slide-in bg-[var(--color-accent-soft)]'
                    : 'bg-black/[0.04]'
                }`}
                style={{ opacity: 1 - idx * 0.2 }}
              >
                {formatClockTime(event.timestamp)}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[10.5px] font-medium text-[var(--color-accent)] cursor-pointer"
          >
            {showAll ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showAll ? 'Less' : `All ${server.recent_refreshes.length}`}
          </button>
        </div>

        <p className="mt-2 text-[10.5px] text-[var(--color-ink-faint)]">
          Internal check every {server.refresh_interval_seconds}s
          {nextCheckinSeconds != null && nextCheckinSeconds > 0.5
            ? `, next in ${Math.ceil(nextCheckinSeconds)}s`
            : ''}
          . Not the identity's real lifetime, just a safety poll.
        </p>

        {showAll && (
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-hairline)] pt-3">
            {newestFirst.map((event) => (
              <EventCard key={event.timestamp} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
