"""Stage 1 live facts: everything here is derived from the real running
spire-agent/stage1-server containers' own stdout, or from a real network
call against the real running stage1-server — nothing here is simulated.

The trust domain and SVID rotation timestamps come from parsing container
logs (`docker logs`), since topic-1-identity/server.py currently only
`print()`s its refresh events rather than logging a structured event via
shared/event_logger.py (flagged separately as a suggested follow-up — see
the project handoff notes). This module never reads or writes any file
inside topic-0-insecure/ or topic-1-identity/, only observes already-running
containers from the outside, exactly like `docker logs`/`curl` would.
"""

from __future__ import annotations

import re
import socket
import ssl
import subprocess
import time

REFRESH_LINE_RE = re.compile(r"\[refresh\] SSL context reloaded with fresh SVID at ([\d.]+)")
TRUST_DOMAIN_RE = re.compile(r"spiffe://([a-zA-Z0-9.-]+)/")

# Documented interval from server.py's own refresh thread — used only to
# estimate the next check-in for the secondary countdown, never to fabricate
# a real timestamp. This is NOT the identity's actual lifetime, just how
# often the thread wakes up to check for a fresh certificate. See
# SVID_TTL_SECONDS below for the real identity lifetime, and the docstring
# on get_stage1_server_svid_status() for why these two numbers are shown
# separately.
REFRESH_INTERVAL_SECONDS = 60

# The real SPIRE-issued workload identity lifetime, set on the workload
# registration entry itself (`spire-server entry create ... -x509SVIDTTL
# 180`). This is the actual answer to "how long is this identity valid
# before SPIRE requires it to be reissued" — REFRESH_INTERVAL_SECONDS above
# is just an application-level safety poll inside that window, not the
# identity management cycle itself.
SVID_TTL_SECONDS = 180

STAGE1_SERVER_HOST = "127.0.0.1"
STAGE1_SERVER_PORT = 5001

# Same request an authorized caller would make (see topic-0-insecure's
# agent.py for the equivalent POST /read_file shape) — only the missing
# client certificate is different. Shown to the user as the literal command
# being run, so it must stay in sync with what test_unauthenticated_connection
# actually sends below.
DEMO_METHOD = "POST"
DEMO_PATH = "/read_file"
DEMO_BODY = b'{"filename": "secret.txt"}'
DEMO_CURL_COMMAND = (
    f"curl -k -X {DEMO_METHOD} https://{STAGE1_SERVER_HOST}:{STAGE1_SERVER_PORT}{DEMO_PATH} "
    f"-d '{DEMO_BODY.decode()}'"
)


def _docker_logs(name: str, tail: int = 200) -> str:
    result = subprocess.run(
        ["docker", "logs", "--tail", str(tail), name],
        capture_output=True, text=True, timeout=10,
    )
    return result.stdout + result.stderr


def get_trust_domain() -> str | None:
    logs = _docker_logs("spire-agent", tail=30)
    match = TRUST_DOMAIN_RE.search(logs)
    return match.group(1) if match else None


def get_stage1_server_svid_status() -> dict:
    """Real refresh-thread check-in history parsed from stage1-server's own
    stdout.

    IMPORTANT LIMITATION, checked directly rather than assumed: there is no
    signal available to this backend, from outside topic-1-identity/, that
    distinguishes an actual new SPIRE-issued SVID from the refresh thread
    simply reloading the same still-valid certificate. spire-agent's own
    logs were checked by hand (`docker logs spire-agent`) and only ever log
    ITS OWN node-level SVID rotation — never a per-workload SVID issuance
    event for stage1-server. server.py's print line
    ("[refresh] SSL context reloaded with fresh SVID at <ts>") doesn't
    include anything (serial number, not-before time) that would let an
    outside observer tell two consecutive check-ins apart. So
    last_refresh_at below is the last observed CHECK-IN, not a confirmed
    reissuance, and svid_ttl_seconds_remaining is an ESTIMATE derived from
    it, not a fact read off the real certificate. Getting a precise signal
    would need a code change in topic-1-identity/server.py (e.g. logging
    the cert's serial/expiry on each reload) — flagged as a suggested
    follow-up, not made here.
    """
    logs = _docker_logs("stage1-server", tail=800)
    timestamps = sorted(float(m) for m in REFRESH_LINE_RE.findall(logs))

    if not timestamps:
        return {
            "tracked": False,
            "last_refresh_at": None,
            "next_refresh_estimate_at": None,
            "refresh_interval_seconds": REFRESH_INTERVAL_SECONDS,
            "svid_ttl_seconds": SVID_TTL_SECONDS,
            "recent_refreshes": [],
        }

    last = timestamps[-1]
    return {
        "tracked": True,
        "last_refresh_at": last,
        "next_refresh_estimate_at": last + REFRESH_INTERVAL_SECONDS,
        "refresh_interval_seconds": REFRESH_INTERVAL_SECONDS,
        # The real SPIRE TTL, and the estimate the frontend uses to drive
        # the primary countdown — see the limitation note above.
        "svid_ttl_seconds": SVID_TTL_SECONDS,
        # Shaped exactly like a real logged event (see shared/event_logger.py)
        # so the frontend can feed these straight into the same EventCard
        # component the real event stream uses — see eventTypes.js's
        # svid_refreshed entry. run_id is null since these aren't tied to
        # any one run; they're stage1-server's own background refresh loop.
        "recent_refreshes": [
            {
                "timestamp": ts,
                "run_id": None,
                "stage": "stage-1",
                "type": "svid_refreshed",
                "actor": "system",
                "data": {"workload": "stage1-server"},
            }
            for ts in timestamps[-40:]
        ],
    }


def test_unauthenticated_connection(timeout: float = 5.0) -> dict:
    """Attempts a real TLS connection to stage1-server WITHOUT presenting a
    client certificate — the same thing DEMO_CURL_COMMAND (shown to the user
    as the command being run) would experience with `-k` and no `--cert`.
    Sends the exact request that command describes, so the two never drift
    apart. Returns the real raw failure; never simulated."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    request = (
        f"{DEMO_METHOD} {DEMO_PATH} HTTP/1.1\r\n"
        f"Host: {STAGE1_SERVER_HOST}\r\n"
        f"Content-Type: application/json\r\n"
        f"Content-Length: {len(DEMO_BODY)}\r\n"
        f"Connection: close\r\n\r\n"
    ).encode() + DEMO_BODY

    started = time.monotonic()
    try:
        with socket.create_connection(
            (STAGE1_SERVER_HOST, STAGE1_SERVER_PORT), timeout=timeout
        ) as sock:
            with ctx.wrap_socket(sock, server_hostname=STAGE1_SERVER_HOST) as tls_sock:
                tls_sock.settimeout(timeout)
                tls_sock.send(request)
                response = tls_sock.recv(4096)
                return {
                    "command": DEMO_CURL_COMMAND,
                    "rejected": False,
                    "elapsed_seconds": time.monotonic() - started,
                    "detail": "Unexpected: the server responded without a client certificate.",
                    "raw": response.decode(errors="replace")[:500],
                }
    except ssl.SSLError as exc:
        return {
            "command": DEMO_CURL_COMMAND,
            "rejected": True,
            "elapsed_seconds": time.monotonic() - started,
            "error_type": type(exc).__name__,
            "detail": str(exc),
        }
    except OSError as exc:
        return {
            "command": DEMO_CURL_COMMAND,
            "rejected": True,
            "elapsed_seconds": time.monotonic() - started,
            "error_type": type(exc).__name__,
            "detail": str(exc),
        }
