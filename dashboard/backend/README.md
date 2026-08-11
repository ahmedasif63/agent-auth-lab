# Dashboard backend

FastAPI layer over the event log at `dashboard/data/events.jsonl`, plus a
thin control layer for starting and stopping runs of the real agent script.
Never simulates, reimplements, or guesses at agent/security logic — reading
endpoints only serve what's already in the log, and the trigger/stop
endpoints only invoke `topic-0-insecure/agent.py` the same way a person
would from a terminal.

## Setup

```bash
cd dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload
```

Serves on http://127.0.0.1:8000.

## Endpoints

- `GET /runs` — list of runs (run_id, stage, task, start_timestamp, `complete`,
  `status`: `"in_progress" | "complete" | "stopped" | "failed"`, `stoppable`:
  whether this backend process currently has that run's subprocess tracked
  live), newest first.
- `GET /runs/{run_id}` — all events for that run, in chronological order.
- `POST /trigger` — body `{"task": "..."}`. Generates a run_id, launches
  `agent.py "<task>" "<run_id>"` via the venv at `topic-0-insecure/venv`, and
  returns immediately with `{"status": "started", "run_id": "..."}` while the
  agent keeps running in the background. Its stdout/stderr are appended to
  `dashboard/logs/trigger.log`.
- `POST /runs/{run_id}/stop` — terminates that run's tracked subprocess
  (SIGTERM, falling back to SIGKILL after ~3s), logs a `run_stopped` event,
  and returns `{"status": "stopped", "run_id": "..."}`. 404s if that run_id
  isn't currently tracked as active (already finished, already stopped, or
  unknown to this backend process).
- `GET /stream` — Server-Sent Events stream of lines appended to the log
  after connecting.

## Failure detection

Each triggered run is watched in a background thread. If its process exits
on its own with a non-zero code (not via `/stop`), the backend logs a
`run_failed` event with a best-effort human-readable reason pulled from that
run's slice of `trigger.log` (the last Python exception line if there is
one). Runs stuck on a clean `exit 0` without ever logging `run_finished`
(e.g. the model returning unparseable output) are **not** currently detected
this way — only non-zero exits are treated as failures, per the original
request this shipped with.

## Known limitations

- Run tracking (`ACTIVE_RUNS`, used for `stoppable` and `/stop`) is in-memory
  only. Restarting the backend forgets about any runs it previously launched
  — they'll still show their last known `status` from the log, just with
  `stoppable: false`.
- Does not check whether `topic-0-insecure/server.py` (the tool server) is
  actually running before triggering — if it's down, `agent.py` will just
  fail on its own requests.
