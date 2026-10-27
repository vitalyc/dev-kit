---
description: Record a decision as a new ADR (or update an existing one)
argument-hint: <decision topic>
---

Record the decision about: $ARGUMENTS

1. Read `docs/decisions/README.md` and ADRs on the same area. If an
   existing ADR covers it, update it (or mark it `Superseded by ADR-NNN`)
   instead of writing a duplicate.
2. Take the facts from this conversation and the code. Use the
   `architect` agent only if alternatives were not discussed yet and the
   decision is non-trivial.
3. Write `docs/decisions/ADR-NNN-<kebab-title>.md` from
   `docs/decisions/ADR-000-template.md` (next free number, today's date,
   Status `Accepted` if the owner agreed, otherwise `Proposed`).
   Never invent rationale; write `Reason not documented` where unknown.
4. Add the row to `docs/decisions/README.md`.
5. Update `ARCHITECTURE.md` / `docs/product/` if the decision changes the
   current system or rules, and add a history entry if significant.
6. Show the ADR summary; commit only if the owner asked to.
