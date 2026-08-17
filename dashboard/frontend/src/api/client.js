const BASE_URL = 'http://127.0.0.1:8000'

async function parseErrorDetail(res) {
  try {
    const body = await res.json()
    return body?.detail ?? `Request failed with status ${res.status}`
  } catch {
    return `Request failed with status ${res.status}`
  }
}

export async function fetchRuns() {
  const res = await fetch(`${BASE_URL}/runs`)
  if (!res.ok) throw new Error(await parseErrorDetail(res))
  return res.json()
}

export async function fetchRunEvents(runId) {
  const res = await fetch(`${BASE_URL}/runs/${encodeURIComponent(runId)}`)
  if (!res.ok) throw new Error(await parseErrorDetail(res))
  return res.json()
}

export async function triggerRun(task, stage) {
  const res = await fetch(`${BASE_URL}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, stage }),
  })
  if (!res.ok) throw new Error(await parseErrorDetail(res))
  return res.json()
}

export async function stopRun(runId) {
  const res = await fetch(`${BASE_URL}/runs/${encodeURIComponent(runId)}/stop`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(await parseErrorDetail(res))
  return res.json()
}

export function openEventStream() {
  return new EventSource(`${BASE_URL}/stream`)
}

export async function fetchStage1Status() {
  const res = await fetch(`${BASE_URL}/stage1/status`)
  if (!res.ok) throw new Error(await parseErrorDetail(res))
  return res.json()
}

export async function testUnauthenticatedConnection() {
  const res = await fetch(`${BASE_URL}/stage1/test-unauthenticated`, { method: 'POST' })
  if (!res.ok) throw new Error(await parseErrorDetail(res))
  return res.json()
}
