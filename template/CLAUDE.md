<!-- dev-kit:begin — managed by dev-kit; project notes go below the end marker. -->
@AGENTS.md

## Claude Code notes

- `AGENTS.md` (imported above) is the single rulebook; do not duplicate
  its rules here.
- Slash commands from the kit: `/start`, `/feature`, `/adr`, `/review`,
  `/finish`, `/handoff`, `/adopt`.
- Subagents live in `.claude/agents/`; the table "Working with subagents"
  in `AGENTS.md` says when to use which.
- Never read or print `.env` contents; use `.env.example` for key names.
<!-- dev-kit:end -->
