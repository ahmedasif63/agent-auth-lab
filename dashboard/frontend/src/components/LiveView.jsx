import { useRuns } from '../hooks/useRuns'
import { useLiveSession } from '../hooks/useLiveSession'
import { useStage1Status } from '../hooks/useStage1Status'
import { useNowTick } from '../hooks/useNowTick'
import Sidebar from './Sidebar'
import TaskInput from './TaskInput'
import AgentPanel from './AgentPanel'
import ToolPanel from './ToolPanel'
import Stage1RotationPanel from './Stage1RotationPanel'
import Stage1UnauthDemo from './Stage1UnauthDemo'

export default function LiveView({ stage }) {
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

  const isStage1 = stage === 'stage-1'
  const { status: stage1Status } = useStage1Status(isStage1)
  const now = useNowTick(1000)

  return (
    <div className="flex h-full">
      <Sidebar
        runs={runs}
        loading={loading}
        selectedRunId={selectedRunId}
        onSelectRun={selectRun}
        onStopRun={stopRun}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-5 p-6 overflow-y-auto">
        <TaskInput
          onTrigger={triggerAndWatch}
          onStop={stopRun}
          isPending={isPending}
          isLive={isLive}
          runId={selectedRunId}
          error={error}
          stage={stage}
        />

        {/* Stage 1's identity is always rotating in the background, and the
            rejection demo hits the real running server directly, so both
            stay visible whether or not a run is active — the page
            shouldn't feel dead just because nothing has been triggered
            yet. Same components as "How this works", not a second
            implementation. Side by side and kept compact so this reads as
            a status strip, not a wall of cards pushing the run output
            down the page. */}
        {isStage1 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Stage1RotationPanel status={stage1Status} now={now} fixedHeight className="sm:flex-1" />
            <div className="sm:flex-1">
              <Stage1UnauthDemo command={stage1Status?.demo_command} fixedHeight />
            </div>
          </div>
        )}

        {events.length === 0 && !isPending ? (
          <div className="flex-1 flex items-center justify-center rounded-[var(--radius-panel)] bg-white/50 backdrop-blur-xl">
            <p className="text-[14px] text-[var(--color-ink-muted)]">
              Select a run from the sidebar, or start a new one above.
            </p>
          </div>
        ) : (
          // No flex-1/min-h-0 here on purpose: these panels grow with the
          // run's actual content, and the page scrolls (outer container is
          // overflow-y-auto) rather than boxing them into the leftover
          // viewport height. Default (stretch) alignment so Agent and Tool
          // panels always match each other's height, whichever has more
          // events.
          <div className="flex gap-5">
            <AgentPanel events={events} />
            <ToolPanel events={events} />
          </div>
        )}
      </div>
    </div>
  )
}
