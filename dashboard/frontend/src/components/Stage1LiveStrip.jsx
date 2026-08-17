const CONNECTION_META = {
  live: { label: 'Live', dotClass: 'bg-[var(--color-success)]' },
  stale: { label: 'Stale', dotClass: 'bg-[var(--color-warning)]' },
  connecting: { label: 'Connecting', dotClass: 'bg-[var(--color-ink-faint)]' },
}

// A small, slim status row, not the headline (that's Stage1RotationPanel).
// Just enough to say "this page is actually talking to something real right
// now": whether the live poll is succeeding, and which trust domain it's
// talking to. Both come from GET /stage1/status, never hardcoded.
export default function Stage1LiveStrip({ status, connectionState }) {
  const connMeta = CONNECTION_META[connectionState] ?? CONNECTION_META.connecting

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[var(--radius-control)] bg-white/60 border border-[var(--color-hairline)] px-4 py-2.5 text-[12px]">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${connMeta.dotClass}`} />
        <span className="text-[var(--color-ink-muted)]">{connMeta.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[var(--color-ink-faint)]">Trust domain</span>
        <span className="font-medium text-[var(--color-ink)]">{status?.trust_domain ?? 'unknown'}</span>
      </div>
    </div>
  )
}
