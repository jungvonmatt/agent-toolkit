# Review Checklist

Use this checklist to keep the review comprehensive and consistent.

## Correctness and regressions

- Verify changed logic for edge cases, null handling, and error paths.
- Check API contract compatibility and data shape assumptions.
- Confirm behavior remains backward compatible where required.
- Record the evidence used for each material conclusion; use `unverified` when it cannot be established.

## Security and robustness

- Check input validation and output encoding.
- Check auth, permission, and data exposure risks.
- Check secrets, tokens, and sensitive logging.
- Inspect failure contracts at external and dependency boundaries; do not assume awaited calls reject.

## Performance focus (high priority)

- Look for repeated expensive operations in loops and render paths.
- Look for unnecessary recomputation, deep watchers, or repeated serialization.
- Check bundle impact from new dependencies.
- Check network behavior: unnecessary requests, no caching, duplicate calls.
- Check server-side query patterns (N+1, missing limits, missing indexes assumptions).
- Check rendering risks: layout thrashing, large DOM updates, heavy synchronous work.
- Distinguish measured performance evidence from static inference and record skipped measurements.
- In full mode, measure affected browser routes (trace for LCP, CLS, and INP of new interactions; network requests) as described in SKILL.md step 5. Compare with the target revision before claiming a regression.
- For web UI changes, check `modern-web-guidance` for native features that replace hand-rolled code and for obsolete patterns.

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

In full mode, verify keyboard, focus, and contrast in the browser and run a
Lighthouse accessibility audit on affected routes (SKILL.md step 5). The static
specialist alone does not cover these.

Record the accessibility status as `passed`, `findings`, `skipped — <reason>`,
or `unavailable — <reason>`. Do not treat an unavailable audit as a clean pass.

For accessible-name, role, focus, dialog, live-announcement, or screen-reader
navigation changes, apply the targeted VoiceOver handoff in
[../SKILL.md](../SKILL.md). Include the affected flow and relevant shared
consumers, not unrelated page content. Real VoiceOver requires an attended
full review and explicit consent. The orchestrator owns it before browser
automation; quick and unattended reviews skip it explicitly. The VoiceOver
check is optional: when the host or consent does not allow it, record
`skipped`/`unavailable — <reason>` as residual risk; it does not block `Ready`.
Keep observed failures separate from unverified causes and unverified
regression attribution.

## Verification coverage

For every applicable check, record exactly one status:

- `passed` — the check ran successfully and its complete output was read
- `findings` — the check ran and produced actionable findings
- `skipped — <reason>` — the check was deliberately inapplicable or could not be run
- `unavailable — <reason>` — the required tool or provider was not available

Before assigning `Ready`, confirm that all required checks are `passed` and
that the target branch and diff source were verified.

## Requirement traceability

When PR/MR or ticket requirements are available, including an explicitly
provided ticket during a local pre-PR review, create a mini matrix:

- Requirement
- Source provider and reference
- Evidence in implementation (file/function/test)
- Status (`Met`, `Partially Met`, `Not Met`)
- Gap or follow-up
