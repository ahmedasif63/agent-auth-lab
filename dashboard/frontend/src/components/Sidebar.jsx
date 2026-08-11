import RunListItem from './RunListItem'

export default function Sidebar({ runs, loading, selectedRunId, onSelectRun, onStopRun }) {
  return (
    <aside className="w-72 shrink-0 h-full border-r border-[var(--color-hairline)] bg-white/60 backdrop-blur-xl flex flex-col">
      <div className="px-5 pt-6 pb-3">
        <h2 className="text-[13px] font-semibold text-[var(--color-ink-muted)] tracking-wide uppercase">
          Run History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 pb-6">
        {loading && runs.length === 0 && (
          <p className="px-3.5 py-3 text-[13px] text-[var(--color-ink-muted)]">Loading runs…</p>
        )}

        {!loading && runs.length === 0 && (
          <p className="px-3.5 py-3 text-[13px] text-[var(--color-ink-muted)]">
            No runs yet. Trigger one to get started.
          </p>
        )}

        <div className="flex flex-col gap-1">
          {runs.map((run) => (
            <RunListItem
              key={run.run_id}
              run={run}
              isSelected={run.run_id === selectedRunId}
              onSelect={onSelectRun}
              onStop={onStopRun}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
