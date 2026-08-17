import { useEffect, useRef, useState } from 'react'
import { fetchStage1Status } from '../api/client'

const POLL_INTERVAL_MS = 4000

// Polls GET /stage1/status, which itself is derived from the real running
// containers' own logs — never simulated. connectionState reflects whether
// that poll is actually succeeding right now ("live"), failing ("stale"),
// or hasn't resolved yet ("connecting"), so the UI never shows numbers that
// might secretly be frozen without saying so.
//
// `enabled` lets a caller skip polling entirely (e.g. Stage 0 is selected
// and this data isn't shown), rather than hitting the backend's docker log
// parsing every few seconds for nothing.
export function useStage1Status(enabled = true) {
  const [status, setStatus] = useState(null)
  const [connectionState, setConnectionState] = useState('connecting')
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setConnectionState('connecting')
      return
    }

    let cancelled = false

    async function poll() {
      try {
        const data = await fetchStage1Status()
        if (cancelled) return
        setStatus(data)
        setConnectionState('live')
      } catch {
        if (cancelled) return
        setConnectionState('stale')
      } finally {
        if (!cancelled) {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timeoutRef.current)
    }
  }, [enabled])

  return { status, connectionState }
}
