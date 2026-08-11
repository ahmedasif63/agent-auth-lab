import { useCallback, useEffect, useState } from 'react'
import { fetchRuns } from '../api/client'

export function useRuns() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchRuns()
      setRuns(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { runs, loading, error, refresh }
}
