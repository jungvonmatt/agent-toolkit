# Output Template

Write all prose in Simplified Technical English (ASD-STE100): one idea per sentence, ≤ 20 words for procedures, ≤ 25 for descriptions, active voice, present tense, articles kept, no gerunds, one term per concept. Code identifiers, paths, URLs, and commands are exempt — write them verbatim.

## Structure

Wrap the entire output in a single fenced code block (` ```markdown `).

When a project PR/MR template exists, use its structure instead of this default. Adapt sections and checklist to match the project's conventions.

````markdown
```markdown
## Description

<!-- 2–4 sentences: what changed and why. Reference ticket if one exists. Do not restate the diff. -->

## Changes

<!-- Bullet list of concrete changes, grouped logically. Be specific. -->

- …
- …

## How to Test

<!-- Actionable steps a reviewer can follow. End with an expected result. -->

1. …
2. …
3. Expected result: …

## Screenshots

<!-- Include ONLY when UI changes exist and screenshots were captured. Omit this entire section otherwise. -->

| Before | After |
|--------|-------|
| ![before](before.png) | ![after](after.png) |

## Checklist

- [x] No secrets, tokens, or credentials in committed code
- [x] No unresolved debugging artifacts (`console.log`, `debugger`)
- [x] TypeScript and linting stay enabled (disabling has a justification)
- [x] Tests cover new or changed logic
- [x] No sensitive data is exposed
- [x] New dependencies are intentional and license-compatible
- [ ] <Unchecked items include a brief note explaining the gap>
```
````

## Rules

- **Description** is 2–4 sentences. No filler. No "This PR enhances…" patterns.
- **Changes** uses concrete bullets. Name files or components when they add clarity. Do not list every touched file — group by purpose.
- **How to Test** contains steps a reviewer can execute. Each step is a command, a URL to visit, or an action to perform. The final step states the expected result.
- **Screenshots** section appears only when screenshots were actually captured. Do not add placeholder text.
- **Checklist** items are checked only when the diff evidence supports it. Unchecked items include a note.
- The output contains no explanation before or after the code block.
