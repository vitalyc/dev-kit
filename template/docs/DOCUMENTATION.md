# Documentation lifecycle

Use only the documents the project needs. Empty templates are scaffolding,
not evidence of an implemented product.

## Discovery

Keep one living docs/PRODUCT_CONCEPT.md while scope and design are still
being explored. Mark each rule or proposal as Agreed, Proposed, Open,
Assumption or Implemented. A concept can contain business, domain and
technical exploration; its title does not make all of it accepted.

PROJECT is a short entry point: purpose, non-goals, pilot scope, current
stage, next validation and links to the concept. ARCHITECTURE describes
only the implemented system; before implementation, say so and link to
proposed designs. Do not invent code, tables or deployment facts.

## Incremental extraction

| Content | Canonical home when extracted |
|---|---|
| Purpose, users, scope, non-goals, roadmap, success criteria | PROJECT.md (summary) |
| Ownership, delegation, visibility, status and permission rules | product/DOMAIN.md |
| User journeys and screens | product/EXPERIENCE.md |
| Use cases and expected outcomes | product/SCENARIOS.md |
| Commercial and growth hypotheses | product/BUSINESS_MODEL.md, when useful |
| Questions, assumptions and validation risks | concept initially; product/DISCOVERY.md when useful |
| Significant proposed or accepted decisions | decisions/ADR-*.md, preserving status |
| Proposed architecture | concept or Proposed ADR; optional design appendix |
| Implemented architecture | ARCHITECTURE.md |
| Environment and release procedure | DEPLOY.md |
| Current work and next steps | HANDOFF.md |

Extract by topic when needed, not by mechanically splitting every heading.
Move canonical text and leave a link in the concept. Preserve source IDs
and distinguish source agreement from current owner approval. Do not turn
an Open question into an Accepted ADR or an example status into a binding
state machine. No need for one ADR per minor rule.

A dated original baseline can remain as an explicitly historical,
read-only reference. It is never another living specification. Otherwise
remove obsolete duplicates after preserving unique content and fixing links.
