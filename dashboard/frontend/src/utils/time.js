// event timestamps from the log are unix seconds (float); Date expects milliseconds.
export function toDate(unixSeconds) {
  return new Date(unixSeconds * 1000)
}

export function formatRelativeTime(unixSeconds) {
  if (unixSeconds == null) return ''

  const diffMs = Date.now() - unixSeconds * 1000
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`

  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`

  const diffDay = Math.round(diffHour / 24)
  return `${diffDay}d ago`
}

export function formatClockTime(unixSeconds) {
  if (unixSeconds == null) return ''
  return toDate(unixSeconds).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
