---
description: Build a feature through the full team sequence — requirements, design, implementation, tests, review, docs
argument-hint: <feature description>
---

Feature: $ARGUMENTS

You are the tech lead. Run the full sequence below, but skip a stage
when it clearly adds nothing (say which and why). Before each stage say
in one line whom you hand the work to and what you expect back; after
it, summarize what came back in a few lines. Give every role full
context: it has not seen this chat.

1. **Requirements** — `product-manager`: scope, roles, rules, acceptance
   checks, open questions. Show the summary and the open questions to
   the owner and **wait for confirmation** before going on. Skip only if
   the owner already gave complete requirements.
2. **Design** — `architect`, only if the feature needs a structural or
   technology decision (new tables, integration, auth, new dependency).
   Show the recommendation; on agreement write the ADR (`/adr`).
3. **Implementation** — `backend-dev` and/or `frontend-dev` with the
   confirmed requirements and design. Run them in parallel when their
   parts are independent (e.g. API contract fixed first). Small parts
   you may do yourself.
4. **Tests** — `tester`: acceptance checks from step 1 as tests; run
   the suite. On failure, go back to step 3 (or `debugger` if the cause
   is unclear).
5. **Review** — `code-reviewer`; plus `security-auditor` for auth,
   permissions, uploads, input → SQL/HTML, money; plus `ui-reviewer` for
   screens when the app can run here. Fix every WILL BREAK finding,
   then re-run the affected tests.
6. **Docs and commit** — `/finish` (docs-keeper, commit message, server
   steps).

Rules:

- Conflicting recommendations: show the trade-off to the owner.
- Scope grows mid-way: stop, re-scope with `product-manager`, confirm.
- Do not push. End with the commits made and the list of owner/server
  steps.
- In a tool without subagents, do each stage yourself as a separate
  pass following the role's file in `.claude/agents/`.
