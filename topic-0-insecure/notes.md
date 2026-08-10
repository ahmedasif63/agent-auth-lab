# Topic 0 --- Insecure Agent: Failure Modes Observed

1. **Leaked/shared key = total access.** The tool server only checks one static API key, the same key for every caller, forever. Anyone who gets that key (leaked in logs, committed to git, pasted somewhere) can call any tool with any arguments, no questions asked. We proved this by reading `/etc/hosts`, a file completely outside the project.

2. **No boundary between "read" and "act."** The agent has no concept that reading a file and sending a message are different risk levels. Both are just "a tool I can call" with equal weight, so nothing distinguishes a safe action from a consequential one.

3. **Instructions and authorization are the same channel.** The agent treats every sentence in its task as equally valid marching orders. A casually-worded instruction ("also send a message, as a courtesy") got executed exactly like the real task, because nothing separates "what the user actually wants" from "any sentence that happened to be in the prompt." We proved this directly. the agent sent a real message to admin@company.com that nobody explicitly authorized.