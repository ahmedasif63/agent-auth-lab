# Dashboard frontend

React + Vite + Tailwind UI for the Agent Auth Lab dashboard. Reads and triggers
runs through the FastAPI backend in `../backend` — it doesn't implement any
agent/security logic itself, only displays what the backend's event log
contains.

## Setup

```bash
cd dashboard/frontend
npm install
```

## Run

Start the backend first (see `../backend/README.md`), then:

```bash
npm run dev
```

Opens on http://localhost:5173. The backend URL is hardcoded to
`http://127.0.0.1:8000` in `src/api/client.js` — change it there if your
backend runs elsewhere.

## Views

- **Live** — a sidebar of past runs (`GET /runs`), a task box that triggers a
  new one (`POST /trigger`), and two panels ("Agent" / "Tool Server") that
  show either a picked run's full history (`GET /runs/{run_id}`) or a
  just-triggered run streaming in live (`GET /stream`).
- **How this works** — a static pipeline diagram explaining the current
  request flow and where its one known vulnerability sits.

## Extending for future stages

This app is designed so that adding a new stage (identity, delegation, policy
enforcement, trust scoring, ...) never requires touching component code:

- New event `type` → add one entry to `src/config/eventTypes.js`.
- New/changed pipeline step → add or edit one entry in
  `src/config/pipelineSteps.js`.

Both files have a comment block at the top documenting the exact shape to
follow. `EventCard`, `AgentPanel`/`ToolPanel`, and `PipelineDiagram` all
render purely by reading these configs — an unrecognized event type falls
back to a generic readable card instead of crashing.

## Known limitations

- **`server_read` / `server_send` events aren't tied to a specific run** in
  the underlying log (`server.py` logs them under a fixed `"server-side"`
  run_id rather than the triggering run's id). That pseudo-run shows up in
  the sidebar as "(no task recorded)" — selecting it is currently the only
  way to see those two event types, since a real run's Tool Server panel
  will only show its own `tool_call` events. This is a property of the
  existing log format, not something the frontend infers or corrects.
