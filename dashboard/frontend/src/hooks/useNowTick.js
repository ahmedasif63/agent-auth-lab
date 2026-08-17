import { useEffect, useState } from 'react'

// A ticking "current time" for smooth client-side countdowns (e.g. "expires
// in 42s") between slower server polls, without hammering the backend every
// second for data that only actually changes every few seconds.
export function useNowTick(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
