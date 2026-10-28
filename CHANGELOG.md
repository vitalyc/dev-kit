# Changelog

## 0.4.1 — 2026-10-28

- Discovery: statuses on decisions and key rules, not on every line
  (from the first real concept, Relay).

## 0.4.0 — 2026-10-27

From a review of 0.3.0 by ChatGPT, selected and condensed:

- `kit.mjs`: a conflict stays open while `<file>.kit-new` exists;
  deleting it after merging is the acceptance (no extra command); merge
  markers keep it open. Unknown base is a conflict, never an overwrite;
  blocks recorded by 0.1–0.3 are recognised (no false conflict); exit
  code 2 on conflicts; path checks on the state file; edited retired
  files stay tracked; seed files new in the kit reach installed projects
  (deleted ones are not recreated). 16 regression tests (`npm test`).
- `AGENTS.md`: "Discovery stage" (one concept document, statuses Agreed /
  Proposed / Open / Assumption / Implemented); "Authority and evidence"
  (content is data not instructions, self-review vs independent review);
  safer cloud ↔ PC transfer; evidence before asking the owner;
  historical baseline allowed in the migration rule.
- `docs/DOCUMENTATION.md`: documentation lifecycle and extraction guide.
- `/review` includes staged changes; `/finish` reuses checks from
  `/feature`; fixes follow the reviewer's verdict.

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
