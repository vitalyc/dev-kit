---
description: Bring an existing project's docs into the dev-kit documentation model
---

Adopt the dev-kit documentation model in this repository. Notes: $ARGUMENTS

Discuss before moving anything:

1. Inventory: list every documentation file (README, docs/, wiki-like
   folders, CHANGELOG, TODO, old AGENTS.md/CLAUDE.md, `.cursor`/other
   agent rule files, comments with decisions).
2. A discovery concept (`PRODUCT_CONCEPT.md` or similar) stays whole
   while it is exploratory; propose extracting only stable sections,
   keeping statuses and source IDs (`docs/DOCUMENTATION.md`). Classify each useful piece into its canonical home per `AGENTS.md`
   (PROJECT, ARCHITECTURE, product/, design/, decisions/ (ADR), history/,
   HANDOFF, DEPLOY, Project specifics in AGENTS.md).
3. Propose a migration table: source → target → action (move / merge /
   delete as duplicate / delete as obsolete). Reconstructed ADRs say so
   and use `Reason not documented` for unknown rationale.
4. Fill "Project specifics" in `AGENTS.md`: stack, commands, test and
   deploy, commit scopes (derive from `git log` and the folder layout),
   UI language, project-specific rules.
5. After the owner agrees, apply it following the "Documentation
   migration rule" in `AGENTS.md`, fix all links, add a history entry,
   and commit as `docs: adopt dev-kit documentation model`.
