// ---------------------------------------------------------------------------
// STAGE 1 SECURITY BOUNDARY — config for Stage1BoundaryFlow.jsx
// ---------------------------------------------------------------------------
// Two request paths, told as a sequence of steps rather than a paragraph:
// where Stage 0 stops an unauthorized caller (inside the application, after
// Flask has already run) versus where Stage 1 stops one (during the TLS
// handshake, before Flask ever runs). `state` drives how each step renders:
//   - "passed": the request actually went through this step
//   - "stop": where the request's path actually ends
//   - "unreached": would come next, but this path never gets there
// ---------------------------------------------------------------------------

import { Radio, Cpu, KeyRound, FileWarning, Lock, Ban } from 'lucide-react'

export const stage0RequestFlow = {
  label: 'Stage 0',
  outcome: 'Reaches the application before being rejected',
  steps: [
    { id: 'request', icon: Radio, label: 'Request arrives', state: 'passed' },
    { id: 'flask', icon: Cpu, label: 'Flask runs', state: 'passed' },
    { id: 'check', icon: KeyRound, label: 'Password checked', state: 'passed' },
    { id: 'error', icon: FileWarning, label: 'Error returned', state: 'stop' },
  ],
}

export const stage1RequestFlow = {
  label: 'Stage 1',
  outcome: 'Rejected before any application code runs',
  steps: [
    { id: 'request', icon: Radio, label: 'Request arrives', state: 'passed' },
    { id: 'handshake', icon: Lock, label: 'TLS handshake', state: 'passed' },
    { id: 'blocked', icon: Ban, label: 'Connection refused', state: 'stop' },
    { id: 'flask', icon: Cpu, label: 'Flask, never runs', state: 'unreached' },
  ],
}
