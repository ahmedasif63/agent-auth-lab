import { useRuns } from '../hooks/useRuns'
import { useLiveSession } from '../hooks/useLiveSession'
import Sidebar from './Sidebar'
import TaskInput from './TaskInput'
import AgentPanel from './AgentPanel'
import ToolPanel from './ToolPanel'

export default function LiveView() {
  const { runs, loading, refresh } = useRuns()
  const {
    selectedRunId,
    events,
    isPending,
    isLive,
    error,
    selectRun,
    triggerAndWatch,
    stopRun,
  } = useLiveSession({ onRunsChanged: refresh })

  return (
    <div className="flex h-full">
      <Sidebar
        runs={runs}
        loading={loading}
        selectedRunId={selectedRunId}
        onSelectRun={selectRun}
        onStopRun={stopRun}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-5 p-6 overflow-hidden">
        <TaskInput
          onTrigger={triggerAndWatch}
          onStop={stopRun}
          isPending={isPending}
          isLive={isLive}
          runId={selectedRunId}
          error={error}
        />

        {events.length === 0 && !isPending ? (
          <div className="flex-1 flex items-center justify-center rounded-[var(--radius-panel)] bg-white/50 backdrop-blur-xl">
            <p className="text-[14px] text-[var(--color-ink-muted)]">
              Select a run from the sidebar, or start a new one above.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex gap-5">
            <AgentPanel events={events} />
            <ToolPanel events={events} />
          </div>
        )}
      </div>
    </div>
  )
}
