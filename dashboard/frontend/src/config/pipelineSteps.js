// ---------------------------------------------------------------------------
// PIPELINE STEPS CONFIG — how new stages get added to the "How this works" view
// ---------------------------------------------------------------------------
// This file is an ordered array describing the pipeline shown top-to-bottom
// in the "How this works" view. PipelineDiagram.jsx renders this array by
// mapping over it — it never hardcodes step boxes. When a future stage adds
// or changes a step in the real pipeline (identity checks, delegation,
// policy enforcement, trust scoring, ...), add or edit ONE object below and
// nothing else in the codebase needs to change.
//
// Each entry has this shape:
//
//   {
//     id: 'unique-kebab-case-id',
//     title: 'Short Step Title',
//     description: 'One or two plain sentences describing what this step does.',
//     vulnerabilityNote: 'Plain-language callout of the gap here.' | null,
//     status: 'solved' | 'vulnerable' | 'planned',
//   }
//
// status meaning (this drives the visual style, see PipelineStep.jsx):
//   'solved'     -> this step exists and has a real check in place today (calm/neutral)
//   'vulnerable' -> this step exists but has a known, real security gap (warning style)
//   'planned'    -> this step doesn't exist yet, shown as a preview only (dashed/muted)
//
// Only what's actually true today should be marked 'solved' or 'vulnerable'.
// ---------------------------------------------------------------------------

export const pipelineSteps = [
  {
    id: 'task-input',
    title: 'Task Input',
    description:
      'A person types a task in plain English and asks the agent to do it. For example: "read this file and tell me what it says."',
    vulnerabilityNote: null,
    status: 'solved',
  },
  {
    id: 'agent-decides',
    title: 'Agent (LLM) Decides An Action',
    description:
      'An AI model reads the task and decides which tool to use, like "read a file" or "send a message", and what to use it for.',
    vulnerabilityNote: null,
    status: 'solved',
  },
  {
    id: 'tool-server-checks',
    title: 'Tool Server Checks API Key Only',
    description:
      'Before running anything, the tool server checks a password sent along with the request.',
    vulnerabilityNote:
      'One shared password for everyone. No check on WHO is asking or WHAT they’re asking for.',
    status: 'vulnerable',
  },
  {
    id: 'action-executes',
    title: 'Action Executes',
    description:
      'The tool server actually performs the action, like reading the file or sending the message, for real.',
    vulnerabilityNote: null,
    status: 'solved',
  },
  {
    id: 'result-logged',
    title: 'Result Logged',
    description:
      'What happened gets written to the event log. This is exactly what the Live view is reading and showing you.',
    vulnerabilityNote: null,
    status: 'solved',
  },
]
