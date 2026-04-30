# Review Checklist

Use this checklist to keep the review comprehensive and consistent.

## Correctness and regressions

- Verify changed logic for edge cases, null handling, and error paths.
- Check API contract compatibility and data shape assumptions.
- Confirm behavior remains backward compatible where required.

## Security and robustness

- Check input validation and output encoding.
- Check auth, permission, and data exposure risks.
- Check secrets, tokens, and sensitive logging.

## Performance focus (high priority)

- Look for repeated expensive operations in loops and render paths.
- Look for unnecessary recomputation, deep watchers, or repeated serialization.
- Check bundle impact from new dependencies.
- Check network behavior: unnecessary requests, no caching, duplicate calls.
- Check server-side query patterns (N+1, missing limits, missing indexes assumptions).
- Check rendering risks: layout thrashing, large DOM updates, heavy synchronous work.

## Accessibility decision rule

Run `a11y-debugging` only when the diff changes one of:

- page or component markup (`.vue`, `.tsx`, `.jsx`, `.html`)
- interactive controls, forms, dialogs, menus, navigation
- keyboard flows, focus management, ARIA labels/roles
- visual styling that can affect contrast or focus visibility

Skip dedicated a11y checks when changes are only:

- backend, config, docs, CI, or pure refactoring without UI impact
- tests that do not alter shipped UI behavior

When running a11y checks, cover at least:

- semantic structure and landmark usage
- accessible names and form labels
- keyboard navigation and focus order
- focus visibility and trapped focus
- color contrast in touched UI areas

## Jira requirement traceability

When a Jira ticket is provided, create a mini matrix:

- Requirement
- Evidence in implementation (file/function/test)
- Status (`Met`, `Partially Met`, `Not Met`)
- Gap or follow-up
