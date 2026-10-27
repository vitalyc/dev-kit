---
description: Finish a change — tests, docs, commit message, server steps
---

Finish the current piece of work. Notes: $ARGUMENTS

Reuse test/review results from earlier in this session (e.g. `/feature`)
when they cover the final change set; after fixes, repeat only the
affected checks. A check that could not run is reported as unverified.

1. **Tests** — run the project's tests for the touched area (see
   `AGENTS.md` Project specifics / `docs/HANDOFF.md`). If they cannot run
   here, say so and give the exact command.
2. **Review** — for non-trivial changes, or anything touching money,
   auth or migrations, run `code-reviewer` (and `security-auditor` when
   relevant). Fix what the verdict requires (always every WILL BREAK);
   say what you do with the rest.
3. **Docs** — run `docs-keeper` with the diff and the decisions from
   this conversation. Check the "Before completing significant work"
   list in `AGENTS.md`.
4. **Commit** — stage only files of this change (never the owner's
   unrelated work or scratch folders); write the message in the
   `AGENTS.md` format with the project's scopes; split into several
   commits if there are several concerns. Use the author identity from
   "Owner and working style" in `AGENTS.md`.
5. **Report** — commits made (`git log --oneline` of them), and an
   explicit list of owner/server steps: migrations, `.env` keys,
   installs, restarts, data fixes — or "none". Do not push unless asked.
