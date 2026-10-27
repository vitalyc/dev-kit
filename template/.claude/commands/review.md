---
description: Review the current change with the right reviewers before committing
argument-hint: [commit sha | range | "staged"]
---

Review target: $ARGUMENTS (empty = uncommitted changes)

1. Determine the change set: uncommitted (`git diff`, `git diff
   --staged` and untracked files), staged only, or the given
   commit/range.
2. Run the `code-reviewer` agent on it with the change's intent.
3. Also run in parallel, when the diff touches them:
   - `security-auditor` — auth, sessions, roles, uploads, SQL built from
     input, HTML rendering of user data, secrets, new dependencies;
   - `ui-reviewer` — views, components, CSS (only if the app can run here).
4. Merge the results into one list ordered WILL BREAK → WILL COST →
   WILL ROT, drop duplicates, give the overall verdict.
5. Do not fix anything yet; ask which findings to fix (recommend: all
   WILL BREAK).
