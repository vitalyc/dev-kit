# Sources

The agents in `template/.claude/agents/` were written for this kit on
2026-10-27, using these as material. Upstream is not tracked: these are
one-time adaptations, owned by the kit.

| Kit agent | Material |
|---|---|
| product-manager, architect, backend-dev, tester, code-reviewer | OpenCode six-agents (product-manager, architect, backend-dev, tester, code-reviewer) |
| tech lead role | OpenCode six-agents `tech-lead` → "Working with subagents" / "How much to delegate" in `AGENTS.md` (the main session is the lead; Claude Code subagents cannot spawn subagents) and the `/feature` command (its sequence and quality gates) |
| code-reviewer | + `surgeon-reviewer` (VoltAgent) — severity tiers, disprove-before-report, verdict |
| docs-keeper | `docs-drift-editor` (VoltAgent) + HouseLedger `AGENTS.md` doc model |
| ui-reviewer | `accessibility-tester`, `ui-ux-tester` (VoltAgent) |
| security-auditor, debugger | written for the Node/Express/React stack; checklist ideas from VoltAgent `security-auditor`, `debugger` |
| frontend-dev | written for React/TS/plain HTML/EJS, RTL |
| AGENTS.md, commands, docs skeleton | HouseLedger (`C:\work_home\HouseLedger`), docs model of 2026-10-21 |

VoltAgent/awesome-claude-code-subagents is MIT licensed
(`VoltAgent-LICENSE.txt`).

Not taken from VoltAgent, on purpose: language specialists outside the
stack, infra/cloud/k8s, data/ML, business and meta-orchestration agents.
Most rely on a "context manager" agent that does not exist and on
generic checklists; they would cost context and confuse agent selection.
If a project needs one (e.g. `postgres-pro`), copy it into that
project's `.claude/agents/` — files not shipped by the kit are never
touched by `kit update`.
