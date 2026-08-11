// ---------------------------------------------------------------------------
// EVENT TYPE CONFIG — how new event types get added to this dashboard
// ---------------------------------------------------------------------------
// This project will grow over several stages (identity, delegation, policy
// enforcement, trust scoring, ...), and every stage introduces new event
// "type" values into the log. To support a new type, add ONE entry to the
// `eventTypeConfig` object below — nothing else in the codebase needs to
// change. EventCard.jsx never hardcodes per-type JSX; it looks everything up
// from here by `event.type`.
//
// Each entry has this shape:
//
//   type_name: {
//     label: 'Short Title Shown At The Top Of The Card',
//     panel: 'agent' | 'tool_server',   // which column this event renders in
//     icon: SomeLucideIcon,             // a component imported from 'lucide-react'
//     description: (data) => `...`,     // plain-language one-liner built from event.data
//     severity: 'neutral' | 'warning' | 'error',
//       // 'warning' turns on the security-flag styling (icon + boxed callout)
//       // 'error'   turns on the same warning-red icon, but WITHOUT the boxed
//       //           callout — for operational failures (crashed, stopped),
//       //           kept visually distinct from an actual security finding
//     warning: 'One-sentence plain-English callout' | undefined, // required if severity is 'warning'
//   }
//
// Rules for `description(data)`:
//   - `data` is the event's raw `data` object and may be missing keys — never
//     assume a field exists, always fall back to something readable.
//   - Keep it one sentence, written for someone with zero security background.
//
// If an event arrives with a `type` that has no entry here yet, EventCard
// falls back to `defaultEventConfig` below — it renders a generic but
// readable card instead of crashing or showing nothing.
// ---------------------------------------------------------------------------

import {
  PlayCircle,
  Brain,
  CheckCircle2,
  Wrench,
  FileText,
  Send,
  HelpCircle,
  Square,
  XCircle,
} from 'lucide-react'

export const eventTypeConfig = {
  run_started: {
    label: 'Run Started',
    panel: 'agent',
    icon: PlayCircle,
    description: (data) =>
      data?.task
        ? `The agent was given a task: "${data.task}"`
        : 'The agent was given a task to work on.',
    severity: 'neutral',
  },

  agent_decision: {
    label: 'Agent Decision',
    panel: 'agent',
    icon: Brain,
    description: (data) => {
      const tool = data?.tool
      const filename = data?.args?.filename
      const recipient = data?.args?.recipient
      if (tool === 'read_file' && filename) {
        return `The AI model decided to read the file "${filename}".`
      }
      if (tool === 'send_message' && recipient) {
        return `The AI model decided to send a message to ${recipient}.`
      }
      if (tool) {
        return `The AI model decided to use the "${tool}" tool.`
      }
      return 'The AI model decided on its next move.'
    },
    severity: 'neutral',
  },

  run_finished: {
    label: 'Run Finished',
    panel: 'agent',
    icon: CheckCircle2,
    description: (data) =>
      data?.summary
        ? `The agent wrapped up: ${data.summary}`
        : 'The agent finished its task.',
    severity: 'neutral',
  },

  tool_call: {
    label: 'Tool Call',
    panel: 'tool_server',
    icon: Wrench,
    description: (data) => {
      const tool = data?.tool ?? 'a tool'
      const status = data?.result?.status
      if (status === 'ok') {
        return `The tool server ran "${tool}" and it succeeded.`
      }
      if (status) {
        return `The tool server ran "${tool}" (result: ${status}).`
      }
      return `The tool server ran "${tool}".`
    },
    severity: 'warning',
    warning:
      'No check was made on whether this specific action should be allowed. Only a shared password was verified.',
  },

  server_read: {
    label: 'File Read',
    panel: 'tool_server',
    icon: FileText,
    description: (data) =>
      data?.filename
        ? `The server read the file "${data.filename}".`
        : 'The server read a file.',
    severity: 'warning',
    warning:
      'No check was made on whether this specific action should be allowed. Only a shared password was verified.',
  },

  server_send: {
    label: 'Message Sent',
    panel: 'tool_server',
    icon: Send,
    description: (data) =>
      data?.recipient
        ? `A message was sent to ${data.recipient}.`
        : 'A message was sent.',
    severity: 'warning',
    warning:
      '⚠ Nothing checked whether this agent was allowed to send this message before it happened.',
  },

  run_stopped: {
    label: 'Run Stopped',
    panel: 'agent',
    icon: Square,
    description: () => 'This run was stopped manually before it finished.',
    severity: 'neutral',
  },

  run_failed: {
    label: 'Run Failed',
    panel: 'agent',
    icon: XCircle,
    description: (data) =>
      data?.message || "This run didn't finish. It may have hit a rate limit or an error.",
    severity: 'error',
  },
}

// Shown for any event.type not found above — keeps the UI readable instead
// of blank or broken as new, not-yet-configured event types show up.
export const defaultEventConfig = {
  label: 'Event',
  panel: 'agent',
  icon: HelpCircle,
  description: (data) =>
    data && Object.keys(data).length > 0
      ? `Something happened, but this dashboard doesn't know how to describe it yet.`
      : 'Something happened.',
  severity: 'neutral',
}

export function getEventConfig(type) {
  return eventTypeConfig[type] ?? defaultEventConfig
}
