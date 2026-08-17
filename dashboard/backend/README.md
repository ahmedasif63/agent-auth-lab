# Dashboard backend

FastAPI layer over the event log at `dashboard/data/events.jsonl`, plus a
thin control layer for starting and stopping runs of the real agent script
(Stage 0, a plain subprocess) or the real agent container (Stage 1, Docker +
SPIFFE/SPIRE + mTLS). Never simulates, reimplements, or guesses at
agent/security logic — reading endpoints only serve what's already in the
log, and the trigger/stop/status endpoints only invoke or observe the real
`topic-0-insecure/` and `topic-1-identity/` processes/containers the same
way a person would from a terminal.

## Setup

```bash
cd dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Stage 1 additionally requires Docker, the `stage1-agent` and `stage1-server`
images already built (`docker build -t stage1-agent -f topic-1-identity/Dockerfile.agent .`
etc., from the repo root — done by hand, not by this backend), and the
`spire-net` Docker network + SPIRE server/agent config already provisioned.

## Run

```bash
uvicorn main:app --reload
```

Serves on http://127.0.0.1:8000.

## Endpoints

- `GET /runs` — list of runs (run_id, stage, task, start_timestamp, `complete`,
  `status`: `"in_progress" | "complete" | "stopped" | "failed" | "unknown"`,
  `stoppable`: whether this backend process currently has that run's
  process/container tracked live), newest first.
- `GET /runs/{run_id}` — all events for that run, in chronological order.
- `POST /trigger` — body `{"task": "...", "stage": "stage-0" | "stage-1"}`
  (`stage` defaults to `"stage-0"`). Generates a run_id and:
  - `stage-0`: launches `topic-0-insecure/agent.py "<task>" "<run_id>"` as a
    plain subprocess via the venv at `topic-0-insecure/venv`, exactly as
    before.
  - `stage-1`: ensures spire-server/spire-agent/stage1-server are up (see
    below), then launches `stage1-agent` as a `docker run --rm` container on
    `spire-net`, sharing spire-agent's PID namespace and Workload API socket,
    with `dashboard/data` mounted in so `shared/event_logger.py` can write
    events from inside the container.

  Returns immediately with `{"status": "started", "run_id": "..."}`; a 503
  if Stage 1's infra couldn't be brought up (see `Stage1InfraError` below).
  stdout/stderr (subprocess or container) are appended to
  `dashboard/logs/trigger.log`.
- `POST /runs/{run_id}/stop` — Stage 0: SIGTERM the subprocess, SIGKILL after
  ~3s. Stage 1: `docker stop -t 3` the container. Either way, logs a
  `run_stopped` event and returns `{"status": "stopped", ...}`. 404s if that
  run_id isn't currently tracked as active.
- `GET /stage1/status` — live facts about Stage 1's identity infra, parsed
  from the real running containers' own logs (never simulated): the SPIFFE
  trust domain (from `spire-agent`'s logs) and `stage1-server`'s SVID refresh
  history (from its own `[refresh] SSL context reloaded...` stdout lines,
  which it already prints every ~60s) — `last_refresh_at`,
  `next_refresh_estimate_at` (last + 60s, an estimate, not a cryptographic
  fact), and `recent_refreshes` pre-shaped as pseudo-events
  (`type: "svid_refreshed"`) so the frontend can feed them straight into the
  same `EventCard` component real events use.
- `POST /stage1/test-unauthenticated` — makes a real TLS connection to the
  real running `stage1-server` on `127.0.0.1:5001` with **no client
  certificate**, and returns the real result (rejected: true/false, the raw
  SSL error). This is the live "try connecting without a certificate" proof
  point — not a canned response.
- `GET /stream` — Server-Sent Events stream of lines appended to the log
  after connecting.

## Stage 1 infrastructure bootstrap (`stage1_docker.py`)

Before a `stage-1` trigger, `ensure_stage1_infra()` checks `spire-server`,
`spire-agent`, and `stage1-server` via `docker ps` and, for each: does
nothing if already running, `docker start`s it if it exists but is stopped,
or `docker run`s the exact command the project owner validated by hand if it
doesn't exist at all. Newly-started containers get a grace period (contains
a stability recheck — see below) before being trusted as ready.

This is a **restart** mechanism for containers with already-valid config —
it does not perform first-time SPIRE setup (creating `spire-net`,
provisioning join tokens, registering workload entries). If that's needed,
`ensure_stage1_infra()` raises `Stage1InfraError` with the real container
logs attached, surfaced to the caller as a 503, rather than attempting to
silently fix it.

**Known hard limitation, found and reproduced by hand:** `spire-agent`'s
`KeyManager` plugin is memory-backed, so stopping its container destroys its
private key even though its cached SVID reference survives; combined with
SPIRE join tokens being one-time-use, this means **`docker start spire-agent`
after a stop can never actually succeed** with the currently-provisioned
token — it will always crash with `"join token does not exist or has
already been used"` and requires the project owner to manually provision a
fresh token and re-register the workload entry. `_wait_until_running()`
accounts for this by rechecking a container is *still* running ~2s after it
first appears up (this specific crash happens ~1s after start), so the
failure surfaces as a clear `Stage1InfraError` here rather than a confusing
downstream Docker error from whatever container tries to use
`--pid=container:spire-agent` next. `spire-server` and `stage1-server` don't
have this problem — only `spire-agent`.

## Failure detection

Each triggered run (subprocess or container) is watched in a background
thread via `process.wait()` — this works identically for both kinds, since
`docker run` (no `-d`) exits with the container's own exit code. If it exits
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
  actually running before triggering a Stage 0 run — if it's down, `agent.py`
  will just fail on its own requests. (Stage 1 *does* get this check, since
  bringing up `stage1-server` is part of `ensure_stage1_infra()`.)
- `stage1-agent`'s built image has no `ENTRYPOINT`, only
  `CMD ["python", "agent.py"]` — `docker run stage1-agent <task> <run_id>`
  would replace the whole CMD rather than append to it, so
  `build_stage1_agent_command()` passes `python agent.py <task> <run_id>`
  explicitly instead. Works fine as-is; adding an `ENTRYPOINT` to
  `Dockerfile.agent` would be a nice-to-have cleanup, not a blocker.
- A run that finishes naturally in the small window between `/stop` being
  called and it taking effect can end up with both a `run_finished` and a
  `run_stopped` event logged for it (harmless — `status` still correctly
  resolves to `"complete"`, since that's checked first). Pre-existing
  behavior, not Stage-1-specific.
