# Topic 0 --- Insecure Agent: Failure Modes Observed

1. **Leaked/shared key = total access.** The tool server only checks one static API key, the same key for every caller, forever. Anyone who gets that key (leaked in logs, committed to git, pasted somewhere) can call any tool with any arguments, no questions asked. We proved this by reading `/etc/hosts`, a file completely outside the project.

2. **No boundary between "read" and "act."** The agent has no concept that reading a file and sending a message are different risk levels. Both are just "a tool I can call" with equal weight, so nothing distinguishes a safe action from a consequential one.

3. **Instructions and authorization are the same channel.** The agent treats every sentence in its task as equally valid marching orders. A casually-worded instruction ("also send a message, as a courtesy") got executed exactly like the real task, because nothing separates "what the user actually wants" from "any sentence that happened to be in the prompt." We proved this directly. the agent sent a real message to admin@company.com that nobody explicitly authorized.
---

# Stage 1 — SPIRE Identity Setup Notes

## What this proves
Node attestation (is this agent process legitimate) is separate from
workload registration (is this specific process allowed to claim this
specific SPIFFE ID). Getting a node attested does NOT automatically mean
any workload on it can fetch an identity — you need both.

## Gotchas hit during setup
1. `insecure_bootstrap = true` was needed in agent.conf because we never
   configured a trust_bundle_path/url. Fine for local dev, not for prod.
2. Registering a workload selector as `unix:uid:<host UID>` failed with
   "no identity issued" — because `docker exec` runs commands inside the
   container as root (UID 0), not as the host user. Selectors are checked
   against the UID *inside the container*, not the host machine.
3. This SPIRE image is distroless (no shell, no `cat`, no `id`), by design,
   smaller attack surface. Had to reason about the UID rather than inspect
   it directly.

## Working setup
- SPIRE server: trust_domain = agentauthlab.local, join_token attestation,
  sqlite datastore, running in Docker on spire-net.
- SPIRE agent: attested via one-time join token, insecure_bootstrap = true.
- Workload entry: spiffe://agentauthlab.local/agent, selector unix:uid:0,
  parent = the join-token-attested agent node.
- Fetch confirmed working: `spire-agent api fetch x509` returns a valid
  SVID with a visible validity window (proof of short-lived, rotating
  identity vs. Stage 0's static never-expiring key).

---

# Stage 1 - Python SPIFFE Client: Socket Reachability and Process Namespace

## The core problem
The spiffe Python library needs to reach the SPIRE agent's Workload API
socket. That socket only exists inside the spire-agent Docker container by
default (/tmp/spire-agent/public/api.sock), invisible outside it.

## Attempt 1: run Python directly on the Mac
Failed with "socket does not exist" even after bind-mounting the socket
folder into the container. Reason: Docker Desktop on Mac runs containers
inside a lightweight Linux VM, not on the Mac's own kernel. Bind mounts
share file contents, but a Unix socket is a live kernel-level connection
endpoint, and that live behavior doesn't reliably cross the Mac-to-VM
boundary. The file appeared to exist on the Mac side but connecting to
it failed ("Connection refused").

## Attempt 2: run Python inside a container, socket mounted normally
Built a minimal Dockerfile.test, ran it on spire-net with the same socket
folder mounted container-to-container (the reliable, native Docker way).
Progress: no longer "file not found." But hit a new error: "Socket closed."

## Why "Socket closed": node attestation vs the unix WorkloadAttestor
SPIRE's unix WorkloadAttestor plugin authenticates the caller of the
Workload API by inspecting the calling process (its UID, etc.) to match
against the registered selector (unix:uid:0). To inspect a process, it
needs visibility into that process, normally via /proc. Two separate
containers have separate, isolated PID namespaces by default, so
spire-agent could see a connection arrive but couldn't identify or
verify the calling process, so it refused it.

## The fix: shared PID namespace
docker run --pid=container:spire-agent makes the test container share
spire-agent's process namespace, so spire-agent can actually see and
attest the calling process. This is not a hack, it reflects how SPIRE
is meant to be deployed: the workload and its local SPIRE agent are
expected to run tightly coupled on the same node (e.g. same pod in
Kubernetes), with mutual process visibility, not as arbitrary distant
processes.

## Working setup, confirmed
docker run --rm --network spire-net --pid=container:spire-agent -v
$(pwd)/spire/agent/socket:/tmp/spire-agent/public -e
SPIFFE_ENDPOINT_SOCKET=unix:///tmp/spire-agent/public/api.sock svid-test
successfully fetched: SPIFFE ID spiffe://agentauthlab.local/agent, cert
chain length 1. This confirms the spiffe Python library, not just the
CLI, can now fetch identities, the real building block for agent.py and
server.py.

---

# Stage 1 - Confirmed spiffe Python library API (for later deep study)

Confirmed directly from the running library (via dir() on a real SVID object),
not just from docs, since docs across versions were inconsistent:

X509Svid object attributes: cert_chain, leaf, load, parse, parse_raw,
private_key, save, spiffe_id

X509Source (from earlier PyPI docs, not yet directly verified the same way):
- source.svid -> the current X509Svid, auto-refreshed in the background
- source.get_bundle_for_trust_domain(TrustDomain('agentauthlab.local'))
  -> the CA trust bundle, used to verify the OTHER side's certificate

Plan for wiring this into Flask (a standard WSGI app, not compatible with
spiffetls's own raw socket listener):
1. X509Source() gives us our own live, auto-rotating cert + key.
2. Since ssl.SSLContext.load_cert_chain() wants file paths, not raw bytes,
   write the current cert_chain and private_key to temp files each time
   the context is built.
3. Load the trust bundle as the list of accepted CAs, so only certs from
   our own trust domain (agentauthlab.local) are accepted from callers.
4. Set ssl_context.verify_mode = ssl.CERT_REQUIRED on the server side,
   this is what actually makes it MUTUAL TLS (server also demands and
   checks a client cert) instead of just normal one-way TLS.

To study later, in depth: the full TLS/mTLS handshake sequence itself
(ClientHello, ServerHello, certificate exchange, key exchange, Finished),
how SPIFFE ID validation layers on top of standard X.509 chain validation,
and why spiffe-tls's own listen()/dial() model doesn't compose with WSGI
frameworks like Flask.

---

# Stage 1 - Final debugging rounds and full working result

## Round: expired certificate (rotation gap discovered)
Server had been running 20+ minutes, but its workload registration entry
had a 180-second TTL (set earlier for the rotation demo). server.py's
build_ssl_context() only runs ONCE, at startup, inside app.run(...). It
never re-checks X509Source for a newer cert. So the server kept using an
already-expired certificate the whole time it sat idle, this only became
visible once agent.py actually tried to connect and verify it.

KNOWN LIMITATION (not yet fixed): the server's ssl_context is a static
snapshot taken once at boot. A production-correct version would rebuild
the context periodically (e.g. on a timer, or via a custom SSLContext
subclass that reloads certs on each handshake) so it always uses a live,
non-expired SVID. Worked around tonight by restarting the server
container to force a fresh cert fetch right before testing. This is a
real, deliberately-flagged gap to fix properly later, not hidden.

## Round: assert_hostname (urllib3's own separate check)
Even with ssl.SSLContext.check_hostname = False set correctly, requests
still failed with "no appropriate subjectAltName fields were found."
Reason: urllib3 (which requests is built on) does its OWN separate
hostname verification pass, independent of the raw ssl module's check.
Fix: also pass assert_hostname=False when building the pool manager in
our custom SpiffeAdapter. Two different libraries, two different
hostname-check switches, both needed to be turned off for the same
underlying reason (SPIFFE certs don't carry DNS hostnames).

## Confirmed: full working end-to-end result
agent.py (containerized, presenting its own SVID via a custom
SpiffeAdapter) successfully called stage1-server (containerized,
presenting its own SVID, requiring and verifying the client's cert) over
real mutual TLS. Both read_file and send_message succeeded. No API key,
no shared secret anywhere in the exchange, identity proven entirely by
certificate on both sides.

---

# Stage 1 - Rotation gap: fixed (not just documented)

## The fix
Added a background thread (threading.Thread, daemon=True) running a
refresh_loop() function that wakes up every 60 seconds, fetches the
current SVID and trust bundle from X509Source (which is already
auto-refreshing internally), and calls context.load_cert_chain(...) /
context.load_verify_locations(...) AGAIN on the SAME ssl.SSLContext
object Flask is actively using, updating it in place rather than
replacing it. Since Werkzeug reads from this one context object fresh on
every incoming connection, all future connections automatically pick up
whatever the latest loaded certificate is, with zero downtime and no
server restart.

## Debugging notes for this fix
1. First attempt: Flask's debug reloader (debug=True) actually runs the
   script twice, a lightweight parent watcher process plus a real child
   process serving traffic. This split made it unclear which process
   the background thread was really running in, and no [refresh] output
   appeared for 3+ minutes. Fixed by adding use_reloader=False to
   app.run(...), removing the second process entirely, one clean
   process running Flask + the background thread together.
2. Added flush=True to all print() calls inside the thread, and an
   immediate "thread started" print outside the sleep loop, plus a
   try/except around the refresh body, specifically so any failure
   would be visible rather than silently swallowed (Python threads do
   not propagate exceptions to the main thread or crash the program by
   default).

## Confirmed working, with evidence
Three consecutive refresh cycles observed, roughly 60 seconds apart:
1786563522, 1786563582, 1786563642 (unix timestamps). Then agent.py was
run successfully against the SAME server process, without restarting it,
after it had been alive for 2+ minutes and had already rotated its
certificate multiple times. Both read_file and send_message succeeded.
This proves the earlier "expired certificate" failure is genuinely
fixed, not merely worked around.

---

# Stage 1 - stage1-server depends on spire-agent's container lifecycle

## What was found
stage1-server is started with --pid=container:spire-agent, which lets it share
spire-agent's process namespace, this is required for SPIRE's unix WorkloadAttestor
to actually see and verify the calling process (documented earlier in this file).

A side effect of this: stage1-server is tied to spire-agent's container lifecycle,
not just its socket. When spire-agent is stopped (for any reason, including a
deliberate restart to apply a config change), stage1-server exits immediately too
(exit code 137, killed because the shared PID namespace it depends on disappeared),
even though nothing is wrong with server.py itself.

## Practical rule going forward
Any time spire-agent is stopped and restarted, for whatever reason, stage1-server
must also be recreated afterward (docker rm + docker run, not just docker start,
since stage1-server was created with --rm-incompatible flags tied to the now-gone
namespace). This is not a bug, it is an inherent consequence of the PID-namespace-
sharing approach, worth remembering rather than being confused by if it happens
again.

## Related: KeyManager disk fix (2026-08-13)
Switched spire-agent's KeyManager plugin from "memory" to "disk" (writing into the
already-mounted spire/agent/data folder), specifically to fix a real recurring pain
point: with memory-backed keys, every container stop (including incidental ones, like
the Mac sleeping or Docker Desktop restarting) destroyed the agent's private key,
forcing a full re-attestation, which requires a fresh one-time join token and
re-registering the workload entry, every single time. Confirmed working: a plain
`docker stop spire-agent` followed by `docker start spire-agent` now shows "SVID
loaded" from disk in the logs, with no re-attestation and no token needed.

Remaining known gap, not fixed yet: this only survives a stop/start of the SAME
container. A full `docker rm` + recreate of spire-agent still wipes its disk-mounted
data too, so it would still need a fresh join token. The permanent fix for that would
be swapping the join_token NodeAttestor for a repeatable one (e.g. NodeAttestor
"unix"), which does not depend on a consumable secret at all. Deliberately deferred
as a separate task, not done yet.
