# Definition of Done

A standing, project-wide bar that every task in the plan must clear before it counts as done. It is different from acceptance criteria.

- **Acceptance criteria** vary per task and answer *"did we build the right thing?"* — they come from the ticket.
- **Definition of Done** is the same for every task and answers *"is it ready?"* — it is the standing quality floor.

A task is done only when **both** its acceptance criteria and this Definition of Done are satisfied.

## Prefer the project's own DoD

If the project already defines a Definition of Done (in `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, a `references/` checklist, or a `docs/` page), use that one and cite it in the plan. Use the baseline below only when the project has none, and tailor it once.

## Baseline standing checklist

Apply to every task before you check it off.

**Correctness**
- All acceptance criteria for the task are met.
- The code runs and behaves as intended, verified at runtime — not only compiled or typechecked.
- New behavior has tests that fail without the change and pass with it.
- Existing tests still pass; the change adds no regressions.
- Edge cases and error paths are handled, not only the happy path.

**Quality**
- Naming and structure reveal intent; no comment is needed to explain what the code does.
- No duplicated business logic, dead code, debug output, or commented-out blocks remain.
- The change stays scoped to the task; no unrelated refactor is included.
- Lint and format pass.

**Integration**
- The change works with the rest of the system, not only in isolation.
- Migrations, config changes, and feature flags are accounted for.
- Backward compatibility is considered for any public interface or API change.

**Documentation**
- Public interfaces, APIs, and user-facing behavior are documented.
- Decisions worth preserving are recorded (see the stress-test step and `docs/adr/`).
- Documentation describes the current state, not the change history.

**Ship-readiness**
- Security implications are reviewed for any untrusted input, auth, or data handling.
- Observability is in place for new critical paths (logs, metrics, traces).
- A rollback path exists for anything risky.
- The human has reviewed and approved before merge or deploy.

## How to apply in the plan

- **Per task:** confirm Correctness and Quality before the task is checked off.
- **Per feature:** confirm Integration and Documentation before the feature is complete.
- **Before merge:** the full checklist is the floor.

Tailor the list to the project once, then reuse it unchanged. A Definition of Done renegotiated per task is not a Definition of Done.

> Adapted from `addyosmani/agent-skills` `references/definition-of-done.md` (MIT). The upstream file is not installed with per-skill copies, so `start-ticket` ships its own.
