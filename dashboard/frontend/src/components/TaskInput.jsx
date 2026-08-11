import { useState } from 'react'
import { Play, Loader2, Square } from 'lucide-react'

export default function TaskInput({ onTrigger, onStop, isPending, isLive, runId, error }) {
  const [task, setTask] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stopping, setStopping] = useState(false)

  const busy = submitting || isPending
  const disabled = busy || task.trim().length === 0
  const showStop = (isPending || isLive) && Boolean(runId)

  async function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    setSubmitting(true)
    try {
      await onTrigger(task.trim())
      setTask('')
    } catch {
      // surfaced via `error` prop
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStop() {
    if (!runId || stopping) return
    setStopping(true)
    try {
      await onStop(runId)
    } catch {
      // surfaced via `error` prop
    } finally {
      setStopping(false)
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-white/70 backdrop-blur-xl shadow-[var(--shadow-card)] px-5 py-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe a task for the agent, e.g. “Read secret.txt and tell me what it says.”"
          disabled={busy}
          className="flex-1 rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] border border-[var(--color-hairline)] px-4 py-2.5 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 transition-colors duration-150 disabled:opacity-60"
        />

        {showStop && (
          <button
            type="button"
            onClick={handleStop}
            disabled={stopping}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-white border border-[var(--color-hairline)] px-3.5 py-2.5 text-[14px] font-medium text-[var(--color-warning)] shadow-[var(--shadow-control)] transition-colors duration-150 hover:bg-[var(--color-warning-soft)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {stopping ? (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            ) : (
              <Square size={12} strokeWidth={2} fill="currentColor" />
            )}
            Stop
          </button>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="shrink-0 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-2.5 text-[14px] font-medium text-white shadow-[var(--shadow-control)] transition-colors duration-150 hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {isPending ? 'Starting…' : 'Run'}
        </button>
      </form>

      {(isPending || isLive) && !error && (
        <p className="mt-2.5 text-[12px] text-[var(--color-ink-muted)]">
          {isPending
            ? 'Waiting for the agent to start…'
            : 'Live: new events will appear below as the agent works.'}
        </p>
      )}

      {error && <p className="mt-2.5 text-[12px] text-[var(--color-warning)]">{error}</p>}
    </div>
  )
}
