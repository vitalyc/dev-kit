---
description: Update docs/HANDOFF.md so the next session (or a new account) can continue
---

Update `docs/HANDOFF.md` for the next session. Notes: $ARGUMENTS

- **Where we stopped** — last finished work (with commit hashes), what
  is in progress, the next step. Replace stale content; do not append a
  diary.
- **Pending owner/server steps** — everything not yet done on the server
  or by the owner; remove items confirmed done.
- **How an agent runs this project** — refresh the recipe if it changed
  in this session (install, database, tests, screenshots, environment
  quirks).
- **Facts that are easy to lose** — add non-obvious facts learned in this
  session that belong nowhere else (domain quirks, external system
  behaviour). If a fact has a canonical home (product rules, ADR,
  ARCHITECTURE), put it there instead.

Keep it short. Show the diff of HANDOFF.md; commit as `docs: ...` if the
owner asked to commit.
