# Reporting Template

Use this compact structure for final review responses.

## Verdict

`Ready` | `Needs changes` | `Blocked` | `Unverified`

One short paragraph describing overall risk level and merge readiness. Mention
the review mode, target branch, diff source, and whether remote requirements
were found.

Use this precedence: `Blocked` when required context or verification is
unavailable; otherwise `Needs changes` when actionable findings remain;
otherwise `Unverified` when a material claim could not be established;
otherwise `Ready`. `Ready` requires every applicable required check to have
completed successfully.

## Findings (P0 to P3)

For each finding:

- `Severity`: P0 | P1 | P2 | P3
- `Title`: short and specific
- `Evidence`: precise file and line reference, plus runtime evidence when relevant
- `Impact`: what can break and for whom
- `Recommendation`: practical fix direction
- `Confidence`: confirmed | static inference | measured | unverified

Report findings in severity order. Do not invent findings to fill a category.

## Checks

- Tests, typecheck, lint, build, and relevant commands that were actually run
- Remote provider and target branch
- Review mode: `PR/MR` or `Local`
- Diff source: `local checkout`, `verified local checkout`, `remote fallback`, or `local-only`
- Fallow verdict and introduced findings, when applicable
- Runtime/browser checks and their result, when applicable
- Every applicable specialist status: `passed`, `findings`, `skipped — <reason>`, or `unavailable — <reason>`
- Skipped or unavailable checks with a concrete reason and residual risk
- Target-ref and diff-source verification status

## Performance Review

Include only when performance signals are present. List confirmed risks first and distinguish measured evidence from static inference. Mention skipped runtime or performance checks and the reason.

## Accessibility Review

Include only when UI accessibility signals are present. State `Checked` with key findings or `Skipped` with an explicit reason.

## Requirements Traceability

Include only when PR/MR or ticket requirements were available. A local review
may use the explicitly supplied ticket even before a PR/MR exists. Identify the
source provider and reference for each requirement. Map each requirement to
implementation evidence and status: `Met`, `Partially Met`, or `Not Met`.
Include the gap or follow-up.

## Open Questions and Residual Risks

- Call out unknowns, assumptions, and missing validation.
- Mention tests that should still be added or executed.
- Include unavailable provider or ticket context when it affected the review.
