# Agent Auth Lab

Step by step project to learn agent authentication and authorization properly, using the tools the industry actually uses right now for each part of the problem.

## the problem, broken down

Agent auth is really four separate questions, each with its own current solution:

1. who is this agent - authentication, solved by SPIFFE/SPIRE
2. on whose authority is it acting - delegation, solved by OAuth token exchange (RFC 8693)
3. should it be allowed to do this specific thing right now - action authorization, not really solved industry wide, doing this with Cedar
4. how risky is it behaving right now - trust scoring, not standardized for agents yet, building this myself

## stages

**stage 0 - baseline (done).** minimal agent with two tools, read a file and send a message, protected by one static api key, no checks on what it can call. gave it a task that only needed reading a file, it also sent an unauthorized message because of an extra instruction slipped into the task. nothing stopped it. notes in `topic-0-insecure/notes.md`.

**stage 1 - authentication (done).** replaced the static key with SPIFFE/SPIRE. ran a SPIRE server and agent locally, registered the agent as a workload, and gave it a short lived X.509 identity (an SVID) that rotates on its own every few minutes instead of one fixed secret. agent and server now talk over mutual TLS using that identity, both sides present and verify a certificate before any request goes through. deleted the hardcoded key from stage 0 entirely. confirmed a caller with no valid certificate gets rejected at the TLS handshake itself, before any application code even runs. notes in `topic-1-identity/notes.md`.

**stage 2 - delegation.** when an agent acts for a user, exchange the user's token for a scoped agent token that carries both identities. logs can then show the user and the agent separately instead of the agent just acting as the user.

**stage 3 - action authorization.** put a policy engine in front of every tool call. before anything runs, check it against actual policies, who, what tool, what arguments, what conditions. allow or deny and log it. this is the exact check missing in stage 0.

**stage 4 - delegation chains and human approval.** handle agents spawning other agents. a sub agent should never end up with more power than its parent, and the full chain should be traceable. add a human approval step for high risk actions.

**stage 5 - trust scoring.** track how the agent behaves over time, call rate, unfamiliar tools, scope drift, combine into a risk score. feed that into stage 3 so low risk stuff passes and high risk stuff gets extra checks or denied.

## tools

- authentication: SPIRE, SPIFFE
- delegation: OAuth 2.0 token exchange (RFC 8693), Auth0 or Keycloak
- action authorization: Cedar
- trust scoring: custom, rule based

## status

stage 0 and 1 done. stages 2-5 in progress.
