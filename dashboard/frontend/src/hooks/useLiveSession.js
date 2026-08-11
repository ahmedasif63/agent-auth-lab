import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRunEvents, openEventStream, stopRun as stopRunApi, triggerRun } from '../api/client'

const TERMINAL_EVENT_TYPES = new Set(['run_finished', 'run_stopped', 'run_failed'])

// Manages "the run currently shown in the main view" — either a historical
// run picked from the sidebar (a one-time fetch) or a freshly triggered run
// that gets live-appended from GET /stream until a terminal event for it
// arrives (run_finished, run_stopped, or run_failed).
//
// POST /trigger returns the run_id it generated up front, so the stream is
// filtered by that exact id from the start — no guessing which run_started
// belongs to us.
export function useLiveSession({ onRunsChanged } = {}) {
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [events, setEvents] = useState([])
  const [isPending, setIsPending] = useState(false) // triggered, waiting for run_started
  const [isLive, setIsLive] = useState(false) // watching a known run_id stream in
  const [error, setError] = useState(null)

  const eventSourceRef = useRef(null)
  const activeRunIdRef = useRef(null)

  const stopWatching = useCallback(() => {
    activeRunIdRef.current = null
    setIsPending(false)
    setIsLive(false)
  }, [])

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    stopWatching()
  }, [stopWatching])

  useEffect(() => closeStream, [closeStream])

  const ensureStream = useCallback(() => {
    if (eventSourceRef.current) return eventSourceRef.current

    const es = openEventStream()

    es.onmessage = (msg) => {
      let event
      try {
        event = JSON.parse(msg.data)
      } catch {
        return
      }

      if (!activeRunIdRef.current || event.run_id !== activeRunIdRef.current) return

      setEvents((prev) => [...prev, event])

      if (event.type === 'run_started') {
        setIsPending(false)
        setIsLive(true)
      }

      if (TERMINAL_EVENT_TYPES.has(event.type)) {
        stopWatching()
        onRunsChanged?.()
      }
    }

    es.onerror = () => {
      setError('Live stream disconnected. Retrying…')
    }
    es.onopen = () => {
      setError(null)
    }

    eventSourceRef.current = es
    return es
  }, [onRunsChanged, stopWatching])

  const selectRun = useCallback(
    async (runId) => {
      closeStream()
      setSelectedRunId(runId)
      setError(null)
      try {
        const data = await fetchRunEvents(runId)
        setEvents(data)
      } catch (err) {
        setError(err.message)
      }
    },
    [closeStream],
  )

  const triggerAndWatch = useCallback(
    async (task) => {
      setError(null)
      let runId
      try {
        const result = await triggerRun(task)
        runId = result.run_id
      } catch (err) {
        setError(err.message)
        throw err
      }

      setSelectedRunId(runId)
      setEvents([])
      setIsPending(true)
      setIsLive(false)
      activeRunIdRef.current = runId
      ensureStream()
      onRunsChanged?.()
    },
    [ensureStream, onRunsChanged],
  )

  const stopRun = useCallback(
    async (runId) => {
      setError(null)
      try {
        await stopRunApi(runId)
      } catch (err) {
        setError(err.message)
        throw err
      }

      onRunsChanged?.()

      // If it's the live-tracked run, the SSE stream will push run_stopped
      // through on its own. Otherwise (a static snapshot from the sidebar),
      // refetch so the user sees it reflected without re-clicking.
      if (runId === selectedRunId && activeRunIdRef.current !== runId) {
        try {
          const data = await fetchRunEvents(runId)
          setEvents(data)
        } catch (err) {
          setError(err.message)
        }
      }
    },
    [selectedRunId, onRunsChanged],
  )

  return {
    selectedRunId,
    events,
    isPending,
    isLive,
    error,
    selectRun,
    triggerAndWatch,
    stopRun,
  }
}
