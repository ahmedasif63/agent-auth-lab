// ---------------------------------------------------------------------------
// STAGE 1 IDENTITY ISSUANCE CHAIN — config for Stage1IssuanceChain.jsx
// ---------------------------------------------------------------------------
// Deliberately a different shape from pipelineSteps.js: this isn't a
// time-ordered request pipeline, it's a structural trust hierarchy (who
// issues identity to whom). Stage1IssuanceChain.jsx renders it as a
// horizontal architecture diagram, not a vertical process line — reflecting
// that this is architecture, not a sequence of steps that happen once per
// request.
//
// Each entry:
//   { id, title, role, description, icon }
// icon is a lucide-react component, looked up here directly (this config's
// only job is issuance-chain content, so there's no separate id->icon
// lookup file the way eventTypes.js/pipelineSteps.js need one).
// ---------------------------------------------------------------------------

import { Server, Cpu, Boxes } from 'lucide-react'

export const stage1IssuanceChain = [
  {
    id: 'spire-server',
    icon: Server,
    title: 'SPIRE Server',
    role: 'Root of trust',
    description:
      'The signing authority for this trust domain. It issues short-lived identities to every SPIRE Agent it trusts. Nothing gets an identity without going through here.',
  },
  {
    id: 'spire-agent',
    icon: Cpu,
    title: 'SPIRE Agent',
    role: 'Local identity provider',
    description:
      'Runs on this machine. It proves itself to the Server once, then hands identities to workloads over a local connection. No shared password. Just proof of which process is asking.',
  },
  {
    id: 'workloads',
    icon: Boxes,
    title: 'agent.py & server.py',
    role: 'Workloads',
    description:
      'Each process asks its local SPIRE Agent for its own identity the moment it starts. It asks again automatically before the old one expires.',
  },
]
