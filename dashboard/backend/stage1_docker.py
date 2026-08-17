"""Stage 1 Docker orchestration: bringing up the SPIRE server/agent and
stage1-server containers on demand, and launching stage1-agent per run.

This module only ever shells out to the `docker` CLI — it never reads or
writes anything inside topic-0-insecure/ or topic-1-identity/. Container
names, image names, and volume-mount shapes below are exactly what the
project owner already validated by hand; see NOTE below for the one
deviation this module makes from that manual testing.

NOTE — stage1-agent image has no ENTRYPOINT, only `CMD ["python", "agent.py"]`.
Running `docker run stage1-agent <task> <run_id>` replaces the whole CMD
instead of appending to it, so Docker tries to exec the task string itself
as a binary and fails immediately. Worked around here by passing the full
`python agent.py <task> <run_id>` command explicitly — no Dockerfile change
needed. Flagged to the project owner as an optional cleanup (add an
ENTRYPOINT) since this module's workaround makes it a non-blocker.
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

SPIRE_NET = "spire-net"

SPIRE_SERVER_NAME = "spire-server"
SPIRE_AGENT_NAME = "spire-agent"
STAGE1_SERVER_NAME = "stage1-server"

SPIRE_SERVER_IMAGE = "ghcr.io/spiffe/spire-server:1.10.1"
SPIRE_AGENT_IMAGE = "ghcr.io/spiffe/spire-agent:1.10.1"
STAGE1_SERVER_IMAGE = "stage1-server"
STAGE1_AGENT_IMAGE = "stage1-agent"

STARTUP_ATTEMPTS = 8
STARTUP_POLL_SECONDS = 0.5
# After a container first reports "running", some failure modes (notably
# spire-agent: its KeyManager is memory-backed, so a stop wipes its private
# key, and its join token is one-time-use, so a restart's forced
# re-attestation crashes with "join token does not exist or has already
# been used") don't surface until a moment after the process comes up. Wait
# this long past the first "running" sighting and recheck before trusting it
# — verified against the real crash timing (~1s after start) by hand.
STABILITY_CHECK_SECONDS = 2.0


class Stage1InfraError(RuntimeError):
    """Stage 1's Docker infrastructure couldn't be brought to a ready state
    automatically and needs the project owner to intervene by hand (e.g. a
    one-time SPIRE join token that's already been used)."""


def _docker(args: list[str], timeout: int = 20) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", *args], capture_output=True, text=True, timeout=timeout
    )


def _container_state(name: str) -> str | None:
    """'running', 'stopped' (exists but not running), or None (doesn't exist)."""
    result = _docker(["ps", "-a", "--filter", f"name=^{name}$", "--format", "{{.State}}"])
    state = result.stdout.strip()
    if not state:
        return None
    return "running" if state == "running" else "stopped"


def _recent_logs(name: str, tail: int = 30) -> str:
    result = _docker(["logs", "--tail", str(tail), name])
    return (result.stdout + result.stderr).strip()


def _wait_until_running(name: str) -> bool:
    for _ in range(STARTUP_ATTEMPTS):
        if _container_state(name) == "running":
            break
        time.sleep(STARTUP_POLL_SECONDS)
    else:
        return False

    # Confirm it's still running after a short settle window, rather than
    # trusting the first "running" sighting — see STABILITY_CHECK_SECONDS.
    time.sleep(STABILITY_CHECK_SECONDS)
    return _container_state(name) == "running"


def _ensure_container(name: str, docker_run_args: list[str]) -> None:
    """docker_run_args is the full arg list including 'run', e.g.
    ['run', '-d', '--name', name, ...]. Only used if the container doesn't
    exist yet — an existing-but-stopped container is just `docker start`ed,
    which is cheaper and preserves its identity for other containers that
    reference it (e.g. --pid=container:spire-agent)."""
    state = _container_state(name)
    if state == "running":
        return

    if state == "stopped":
        result = _docker(["start", name])
        if result.returncode != 0:
            raise Stage1InfraError(
                f"Failed to start existing container '{name}': {result.stderr.strip()}"
            )
    else:
        result = _docker(docker_run_args)
        if result.returncode != 0:
            raise Stage1InfraError(
                f"Failed to create container '{name}': {result.stderr.strip()}"
            )

    if not _wait_until_running(name):
        logs = _recent_logs(name)
        hint = ""
        if "join token" in logs.lower():
            hint = (
                " This looks like the one-time SPIRE join token has already been "
                "used or expired — that needs to be manually reprovisioned (new "
                "token + re-registered workload entry), not something this can "
                "safely fix automatically."
            )
        raise Stage1InfraError(
            f"Container '{name}' did not reach a running state.{hint} "
            f"Recent logs:\n{logs[-800:]}"
        )


def ensure_stage1_infra(repo_root: Path) -> None:
    """Idempotently ensures spire-server, spire-agent, and stage1-server are
    all running, starting or creating whichever ones aren't. Only for
    restarting containers with already-valid config — does not attempt
    first-time SPIRE setup (network, join tokens, registration)."""
    spire_server_conf = repo_root / "spire" / "server" / "conf"
    spire_server_data = repo_root / "spire" / "server" / "data"
    spire_agent_conf = repo_root / "spire" / "agent" / "conf"
    spire_agent_data = repo_root / "spire" / "agent" / "data"
    spire_agent_socket = repo_root / "spire" / "agent" / "socket"

    _ensure_container(
        SPIRE_SERVER_NAME,
        [
            "run", "-d", "--name", SPIRE_SERVER_NAME, "--network", SPIRE_NET,
            "-v", f"{spire_server_conf}:/opt/spire/conf",
            "-v", f"{spire_server_data}:/opt/spire/data",
            "-p", "8081:8081",
            SPIRE_SERVER_IMAGE, "-config", "/opt/spire/conf/server.conf",
        ],
    )

    _ensure_container(
        SPIRE_AGENT_NAME,
        [
            "run", "-d", "--name", SPIRE_AGENT_NAME, "--network", SPIRE_NET,
            "-v", f"{spire_agent_conf}:/opt/spire/conf",
            "-v", f"{spire_agent_data}:/opt/spire/data",
            "-v", f"{spire_agent_socket}:/tmp/spire-agent/public",
            SPIRE_AGENT_IMAGE, "-config", "/opt/spire/conf/agent.conf",
        ],
    )

    _ensure_container(
        STAGE1_SERVER_NAME,
        [
            "run", "-d", "--name", STAGE1_SERVER_NAME, "--network", SPIRE_NET,
            "--pid=container:spire-agent",
            "-v", f"{spire_agent_socket}:/tmp/spire-agent/public",
            "-e", "SPIFFE_ENDPOINT_SOCKET=unix:///tmp/spire-agent/public/api.sock",
            "-p", "5001:5001",
            STAGE1_SERVER_IMAGE,
        ],
    )


def build_stage1_agent_command(
    repo_root: Path, task: str, run_id: str, container_name: str
) -> list[str]:
    spire_agent_socket = repo_root / "spire" / "agent" / "socket"
    dashboard_data = repo_root / "dashboard" / "data"

    return [
        "docker", "run", "--rm", "--name", container_name,
        "--network", SPIRE_NET,
        "--pid=container:spire-agent",
        "-v", f"{spire_agent_socket}:/tmp/spire-agent/public",
        "-v", f"{dashboard_data}:/app/dashboard/data",
        "-e", "SPIFFE_ENDPOINT_SOCKET=unix:///tmp/spire-agent/public/api.sock",
        STAGE1_AGENT_IMAGE,
        "python", "agent.py", task, run_id,
    ]


def stop_stage1_container(container_name: str, grace_seconds: int = 3) -> None:
    _docker(["stop", "-t", str(grace_seconds), container_name], timeout=grace_seconds + 10)
