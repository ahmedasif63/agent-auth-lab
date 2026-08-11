# Project rules for Claude Code

This repo is a learning project for AI agent security. It has two kinds of content:

1. `topic-0-insecure/`, and every future `topic-N-*` folder — these contain hand-written learning code
   built by the repo owner personally, on purpose, step by step, to learn agent authentication and
   authorization. This code must NEVER be edited, refactored, "improved," or touched by Claude Code,
   under any circumstances, even if asked indirectly or if it looks like it has bugs. If asked to work
   on something that would require touching these folders, stop and explain why instead.

2. `dashboard/` — this is the only folder Claude Code should read from, write to, or run commands in.
   This is a separate frontend + backend built to visualize and test what happens in the topic-N folders,
   by reading a shared event log at `shared/events.jsonl`. It should never simulate, reimplement, or guess
   at agent/security logic — only display what the log actually contains.

If a task seems to require changing anything outside `dashboard/` or `shared/event_logger.py`, stop and
ask for confirmation first instead of proceeding.