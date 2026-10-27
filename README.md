# dev-kit

My working template for full-stack web projects (Node.js, Express,
React, TypeScript, plain HTML): documentation as project memory, my
working rules, a small team of agent roles and procedures, and a script
that installs and updates them in every project.

Everything is plain Markdown inside the project's repository, so it
travels with git to another computer, Claude account or AI tool.
`AGENTS.md` is the rulebook; Claude Code reads it through `CLAUDE.md`,
Codex, Cursor and OpenCode read `AGENTS.md` directly. Roles and
commands live in `.claude/`, where Claude Code loads them natively;
other tools follow them as playbooks ("Roles and commands in any AI
tool" in `template/AGENTS.md`).

## What a project gets

| Path | Kind | Updated by `kit update` |
|---|---|---|
| `AGENTS.md` | rules for every AI tool and my working style: kit block + **Project specifics** | kit block only |
| `CLAUDE.md` | imports `AGENTS.md` + Claude notes | kit block only |
| `.claude/agents/*.md` | 10 subagents | yes, unless edited locally |
| `.claude/commands/*.md` | `/start` `/feature` `/adr` `/review` `/finish` `/handoff` `/adopt` | yes, unless edited locally |
| `.claude/settings.json` | denies reading `.env` | no (created once; seeds new in the kit are added) |
| `docs/` | PROJECT, ARCHITECTURE, HANDOFF, DEPLOY, decisions/, product/, history/, design/ | no (created once; seeds new in the kit are added) |
| `.claude/dev-kit.json` | installed version and file hashes | written by the script |

Subagents: `product-manager`, `architect`, `backend-dev`,
`frontend-dev`, `tester`, `debugger`, `code-reviewer`,
`security-auditor`, `ui-reviewer`, `docs-keeper`. When to use which:
"Working with subagents" in `template/AGENTS.md`. How much to delegate
is the agent's call by default; the owner can override it per request
(e.g. `/feature` = full tech-lead sequence) or write a fixed protocol in
the project's "Delegation" section.

## Use

Requires Node 18+.

```bash
# new or existing project
node kit.mjs init ../MyProject          # --dry-run to preview
# later, after changing the kit
node kit.mjs status ../MyProject        # what would change
node kit.mjs update ../MyProject
```

Then in the project, in any AI tool: `/adopt` (existing project: move old
docs into the model and fill Project specifics) or fill
`docs/PROJECT.md` and Project specifics by hand (new project). Commit
the result.

### Conflicts

Your local edits are kept while the kit has not changed. If both you and
the kit changed a file (or `AGENTS.md` has no known base), `update`
leaves your file alone and writes `<file>.kit-new` next to it. Take
what you want from it into the file and delete the `.kit-new`; the next
`update` accepts your merge. Nothing is lost silently: until the
`.kit-new` is gone, the conflict stays open. Exit code 2 = open
conflicts, 1 = error. `--force` overwrites local edits.

Project-specific agents or commands (files the kit does not ship) are
never touched.

## Change the kit

1. Edit files in `template/`.
2. Bump `VERSION`, add a line to `CHANGELOG.md`, commit.
3. `node kit.mjs update <project>` in each project; commit there as
   `docs: update dev-kit to X.Y.Z`.

## Layout

| Path | Content |
|---|---|
| `template/` | files copied into projects |
| `kit.mjs` | installer / updater, no dependencies |
| `sources/` | where the agents came from, licenses |
| `tests/` | installer regression tests: `npm test` |

## Limits

- Role files are instructions, not installed tools: they do not add
  browsers, databases, MCP servers or permissions to an AI tool.
- `.claude/settings.json` (deny reading `.env`) is created once and never
  merged into existing settings; it is defence in depth, not a secret
  boundary.
- Projects in discovery keep one concept document; see
  `template/docs/DOCUMENTATION.md`.
