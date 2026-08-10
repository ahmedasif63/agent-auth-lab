# Agent Auth Lab

A step-by-step project to learn and implement AI agent authentication and authorization, using the current industry-standard tools for each layer of the problem.

## The problem, broken into parts

Agent auth is really four separate questions, each with its own current best solution:

1. **Who is this agent?** — Authentication. Solved by SPIFFE/SPIRE.
2. **On whose authority is it acting?** — Delegation. Solved by OAuth token exchange (RFC 8693).
3. **Should it be allowed to do this specific thing, right now?** — Action authorization. Not cleanly solved industry-wide. Solved here using Cedar, a policy engine.
4. **How risky is its behavior right now?** — Trust scoring. Not standardized for agents yet. Built from scratch in this project.

## Build stages

**Stage 0 — Baseline (done).** A minimal agent with two tools (read a file, send a message), protected by one static API key, with no checks on what it can call. Used to observe failure modes directly: the agent was given a task that only required reading a file, but a second instruction embedded in the task got it to also send an unauthorized message. Nothing in the system checked whether that action should have been allowed. Details in `topic-0-insecure/notes.md`.

**Stage 1 — Authentication (SPIFFE/SPIRE).** Replace the static API key with SPIFFE/SPIRE. Each agent gets a short-lived, automatically-rotating cryptographic identity (an SVID) instead of a fixed shared secret. Agent and tool server communicate over mutual TLS using these identities.

**Stage 2 — Delegation (OAuth token exchange).** When an agent acts on behalf of a user, exchange the user's token for a scoped agent token that carries both identities (the `act` claim per RFC 8693). This makes it possible to distinguish, in logs, between the user and the agent acting for them, instead of the agent just reusing the user's token.

**Stage 3 — Action authorization (Cedar).** Add a policy engine in front of every tool call. Before any tool runs, the call is checked against explicit policies (who, what tool, what arguments, under what conditions). Allowed calls proceed; denied calls are blocked and logged. This is the check that was missing in Stage 0.

**Stage 4 — Delegation chains and human approval.** Handle cases where one agent spawns another agent. Enforce that a sub-agent's permissions are always a subset of its parent's, and preserve the full chain of authority in logs. Add a human-in-the-loop approval step for high-risk actions using an async approval flow (CIBA).

**Stage 5 — Trust scoring.** Track behavioral signals per agent (call rate, unfamiliar tool usage, scope drift) and combine them into a live risk score. Feed that score into the Stage 3 policy engine so that low-risk actions pass normally and high-risk or anomalous behavior triggers extra approval or a denial.

## Tools used per stage

- Authentication: SPIRE, SPIFFE
- Delegation: OAuth 2.0 token exchange (RFC 8693), Auth0 or Keycloak
- Action authorization: Cedar
- Trust scoring: custom, rule-based

## Status

Stage 0 complete. Stages 1–5 in progress.