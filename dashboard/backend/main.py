import asyncio
import json
import re
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from stage1_docker import (
    Stage1InfraError,
    build_stage1_agent_command,
    ensure_stage1_infra,
    stop_stage1_container,
)
from stage1_status import (
    DEMO_CURL_COMMAND,
    get_stage1_server_svid_status,
    get_trust_domain,
    test_unauthenticated_connection,
)

DASHBOARD_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = DASHBOARD_DIR.parent

sys.path.append(str(REPO_ROOT / "shared"))
from event_logger import log_event  # noqa: E402  (path must be set up first)

LOG_PATH = DASHBOARD_DIR / "data" / "events.jsonl"
POLL_INTERVAL_SECONDS = 0.5

AGENT_SCRIPT = REPO_ROOT / "topic-0-insecure" / "agent.py"
AGENT_PYTHON = REPO_ROOT / "topic-0-insecure" / "venv" / "bin" / "python"
TRIGGER_LOG_PATH = DASHBOARD_DIR / "logs" / "trigger.log"

DEFAULT_STAGE = "unknown"
EXCEPTION_LINE_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception)\b.*:")

app = FastAPI(title="Agent Auth Lab Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# run_id -> {"process": Popen, "log_offset": int, "kind": "subprocess" | "docker",
# "container_name": str | None}, only for runs this backend process launched
# and that haven't exited yet. Guards against the /trigger, /stop, and
# background watcher threads racing on the same entry. "kind"/"container_name"
# only matter to /stop (docker runs are stopped via `docker stop`, not
# process.terminate()) — watch_process treats both kinds identically since it
# only cares about process.wait()/returncode either way.
ACTIVE_RUNS: dict[str, dict[str, Any]] = {}
ACTIVE_RUNS_LOCK = threading.Lock()


def read_events() -> list[dict[str, Any]]:
    if not LOG_PATH.exists():
        return []

    events = []
    with LOG_PATH.open("r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def get_stage_for_run(run_id: str) -> str | None:
    for event in read_events():
        if event.get("run_id") == run_id and event.get("stage"):
            return event["stage"]
    return None


def extract_crash_reason(log_offset: int) -> str | None:
    """Best-effort human-readable reason, pulled from this run's slice of
    trigger.log. Prefers the last Python exception line if there is one,
    otherwise falls back to the last line of output."""
    if not TRIGGER_LOG_PATH.exists():
        return None
    try:
        with TRIGGER_LOG_PATH.open("r") as f:
            f.seek(log_offset)
            tail = f.read()
    except OSError:
        return None

    lines = [line.strip() for line in tail.splitlines() if line.strip()]
    if not lines:
        return None

    for line in reversed(lines):
        if EXCEPTION_LINE_RE.match(line):
            return line[:300]
    return lines[-1][:300]


def watch_process(run_id: str, process: subprocess.Popen, log_offset: int) -> None:
    process.wait()

    with ACTIVE_RUNS_LOCK:
        was_still_active = ACTIVE_RUNS.pop(run_id, None) is not None

    if not was_still_active:
        # Already removed by /stop, which logs its own run_stopped event.
        return

    if process.returncode != 0:
        stage = get_stage_for_run(run_id) or DEFAULT_STAGE
        message = extract_crash_reason(log_offset) or "The agent process stopped unexpectedly."
        log_event(run_id, stage, "run_failed", "system", {"message": message})


def compute_run_status(run_events: list[dict[str, Any]], is_tracked: bool) -> str:
    types = {e.get("type") for e in run_events}
    if "run_finished" in types:
        return "complete"
    if "run_stopped" in types:
        return "stopped"
    if "run_failed" in types:
        return "failed"
    # No terminal event. Only report "in_progress" if this backend process
    # actually launched and is still watching it — otherwise it can never
    # resolve (e.g. agent.py run by hand outside /trigger), so it's
    # "unknown" rather than permanently stuck. Based purely on whether the
    # run_id is in ACTIVE_RUNS right now, not on any timestamp/elapsed-time
    # logic.
    return "in_progress" if is_tracked else "unknown"


@app.get("/runs")
def list_runs(response: Response):
    response.headers["Cache-Control"] = "no-store"
    events = read_events()

    by_run: dict[str, list[dict[str, Any]]] = {}
    order: list[str] = []
    for event in events:
        run_id = event.get("run_id")
        if run_id is None:
            continue
        if run_id not in by_run:
            by_run[run_id] = []
            order.append(run_id)
        by_run[run_id].append(event)

    with ACTIVE_RUNS_LOCK:
        active_ids = set(ACTIVE_RUNS.keys())

    runs = []
    for run_id in order:
        run_events = by_run[run_id]
        run_started = next((e for e in run_events if e.get("type") == "run_started"), None)
        earliest = min(run_events, key=lambda e: e.get("timestamp") or 0)
        source = run_started or earliest

        runs.append({
            "run_id": run_id,
            "stage": source.get("stage"),
            "task": (run_started.get("data") or {}).get("task") if run_started else None,
            "start_timestamp": source.get("timestamp"),
            "complete": any(e.get("type") == "run_finished" for e in run_events),
            "status": compute_run_status(run_events, run_id in active_ids),
            "stoppable": run_id in active_ids,
        })

    runs.sort(key=lambda r: r["start_timestamp"] or 0, reverse=True)
    return runs


@app.get("/runs/{run_id}")
def get_run(run_id: str, response: Response):
    response.headers["Cache-Control"] = "no-store"
    run_events = [e for e in read_events() if e.get("run_id") == run_id]
    run_events.sort(key=lambda e: e.get("timestamp") or 0)
    return run_events


@app.post("/trigger")
def trigger_run(payload: dict = Body(...)):
    task = payload.get("task")
    if not isinstance(task, str) or not task.strip():
        raise HTTPException(status_code=400, detail="'task' must be a non-empty string")

    stage = payload.get("stage", "stage-0")
    if stage not in ("stage-0", "stage-1"):
        raise HTTPException(status_code=400, detail="'stage' must be 'stage-0' or 'stage-1'")

    run_id = str(uuid.uuid4())

    TRIGGER_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    log_file = TRIGGER_LOG_PATH.open("a")
    log_file.write(
        f"\n--- {datetime.now(timezone.utc).isoformat()} | trigger stage={stage} "
        f"run_id={run_id} task={task!r} ---\n"
    )
    log_file.flush()
    log_offset = log_file.tell()  # subprocess output starts here, after our own header

    if stage == "stage-1":
        try:
            ensure_stage1_infra(REPO_ROOT)
        except Stage1InfraError as exc:
            log_file.close()
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        container_name = f"stage1-run-{run_id}"
        command = build_stage1_agent_command(REPO_ROOT, task, run_id, container_name)
        cwd = None
        kind = "docker"
    else:
        container_name = None
        command = [str(AGENT_PYTHON), str(AGENT_SCRIPT), task, run_id]
        cwd = str(AGENT_SCRIPT.parent)
        kind = "subprocess"

    print(f"[trigger] launching stage={stage} run_id={run_id} task={task!r}")

    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdin=subprocess.DEVNULL,
        stdout=log_file,
        stderr=subprocess.STDOUT,
    )
    log_file.close()

    with ACTIVE_RUNS_LOCK:
        ACTIVE_RUNS[run_id] = {
            "process": process,
            "log_offset": log_offset,
            "kind": kind,
            "container_name": container_name,
        }

    threading.Thread(
        target=watch_process, args=(run_id, process, log_offset), daemon=True
    ).start()

    return {"status": "started", "run_id": run_id}


@app.post("/runs/{run_id}/stop")
def stop_run(run_id: str):
    with ACTIVE_RUNS_LOCK:
        entry = ACTIVE_RUNS.pop(run_id, None)

    if entry is None:
        raise HTTPException(status_code=404, detail="No active run with this id")

    process: subprocess.Popen = entry["process"]

    if entry["kind"] == "docker":
        stop_stage1_container(entry["container_name"])
        try:
            process.wait(timeout=8)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
    else:
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()

    stage = get_stage_for_run(run_id) or DEFAULT_STAGE
    log_event(run_id, stage, "run_stopped", "system", {"reason": "stopped by user"})

    return {"status": "stopped", "run_id": run_id}


@app.get("/stage1/status")
def stage1_status(response: Response):
    """Live facts about Stage 1's identity infrastructure, derived from the
    real running containers' own logs — see stage1_status.py."""
    response.headers["Cache-Control"] = "no-store"
    return {
        "trust_domain": get_trust_domain(),
        "stage1_server": get_stage1_server_svid_status(),
        # Same string test_unauthenticated_connection() actually executes —
        # single source of truth in stage1_status.py, so what the terminal
        # UI types out can never drift from what the backend really sends.
        "demo_command": DEMO_CURL_COMMAND,
    }


@app.post("/stage1/test-unauthenticated")
def stage1_test_unauthenticated():
    """Makes a real TLS connection to the real running stage1-server without
    a client certificate, and returns the real rejection (or, if somehow
    unrejected, that too) — never a canned/simulated response."""
    return test_unauthenticated_connection()


@app.get("/stream")
async def stream_events(request: Request):
    async def event_generator():
        last_size = LOG_PATH.stat().st_size if LOG_PATH.exists() else 0

        while True:
            if await request.is_disconnected():
                break

            if not LOG_PATH.exists():
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
                continue

            current_size = LOG_PATH.stat().st_size
            if current_size < last_size:
                # file was truncated or replaced; start reading from the top again
                last_size = 0

            if current_size > last_size:
                with LOG_PATH.open("r") as f:
                    f.seek(last_size)
                    new_data = f.read()
                    last_size = f.tell()

                for line in new_data.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    yield f"data: {json.dumps(event)}\n\n"

            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
