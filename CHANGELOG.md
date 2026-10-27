# Changelog

## 0.3.0 — 2026-10-27

- `/feature`: the tech-lead sequence from OpenCode six-agents —
  requirements (confirmed by the owner) → design/ADR → implementation →
  tests → review → docs and commit.
- `AGENTS.md`: "How much to delegate" — owner's request, then the
  project's optional "Delegation" section, otherwise the agent's own
  judgment (levels Direct / Standard / Full as guidance, not mandatory).
- Project specifics template: optional "Delegation" section.

## 0.2.0 — 2026-10-27

- Tool-neutral: everything lives in the repository. The owner's working
  style moved from `user/CLAUDE.md` (~/.claude) into the kit block of
  `AGENTS.md`; `kit user` and `user/` removed.
- `AGENTS.md`: "Roles and commands in any AI tool" — agents and commands
  are Markdown playbooks that Codex, Cursor, OpenCode etc. follow by
  reading the file.
- `HANDOFF.md` template: marked as the portable state of the work.

## 0.1.0 — 2026-10-27

- First version, extracted from HouseLedger: `AGENTS.md` rules (kit
  block + Project specifics), `CLAUDE.md`, docs skeleton.
- Agents: product-manager, architect, backend-dev, frontend-dev, tester,
  debugger, code-reviewer, security-auditor, ui-reviewer, docs-keeper.
- Commands: /start, /adr, /review, /finish, /handoff, /adopt.
- `kit.mjs`: init, update, status, user.
