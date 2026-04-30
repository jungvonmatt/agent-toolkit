# Reporting Template

Use this output structure for final review responses.

## Executive Summary

- One short paragraph describing overall risk level and release readiness.

## Findings (P0 to P3)

For each finding:

- `Severity`: P0 | P1 | P2 | P3
- `Title`: short and specific
- `Evidence`: file and line reference
- `Impact`: what can break and for whom
- `Recommendation`: practical fix direction
- `Example`: optional short example to clarify the issue

## Performance Review

- List confirmed performance risks first.
- Distinguish measured evidence vs static code inference.
- Mention skipped runtime/perf checks with reason.

## Static Analysis (Fallow)

- State either:
  - `Checked` with findings grouped by category (dead code, complexity, duplication), or
  - `Skipped` with reason (e.g. Fallow not installed).
- Only report issues **introduced by this branch** (the audit is already scoped to changed files).
- Flag unused exports/files added in this PR as P2, high-complexity new functions as P2, and introduced duplication as P3.

## Accessibility Review

- State either:
  - `Checked` with key findings, or
  - `Skipped` with explicit reason based on diff scope.

## Jira Requirements Traceability

- Include only if a Jira ticket was provided.
- Map each requirement to implementation evidence and status.

## Open Questions and Residual Risks

- Call out unknowns, assumptions, and missing validation.
- Mention tests that should still be added or executed.
