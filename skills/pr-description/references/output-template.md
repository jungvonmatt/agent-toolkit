# Output Template

Write all prose in Simplified Technical English (ASD-STE100): one idea per sentence, ≤ 20 words for procedures, ≤ 25 for descriptions, active voice, present tense, articles kept, no gerunds, one term per concept. Code identifiers, paths, URLs, and commands are exempt — write them verbatim.

## Structure

Wrap the entire output in a single fenced code block opened with four backticks (` ````markdown `), so code blocks inside the description stay intact.

When a project PR/MR template exists, use its structure instead of this default. Adapt sections and checklist to match the project's conventions.

`````markdown
````markdown
## Description

<!-- 2–5 sentences: summarize what changed, why, and the user-facing effect. Reference ticket if one exists. The reviewer has the diff — do not list files or repeat code-level details. -->

## How to Test

<!-- Actionable steps a reviewer can follow. End with an expected result. -->

1. …
2. …
3. Expected result: …

## Screenshots

<!-- Include ONLY when the diff touches UI files. Omit this entire section otherwise. Leave the placeholder for the author to paste before/after images. -->

_UI changed. Paste before/after screenshots here._

| Before | After |
|--------|-------|
|        |       |

## Checklist

<!-- Tick an item only when the diff proves it. Leave it unticked with a short note otherwise. -->

- [ ] No secrets, tokens, or credentials in committed code
- [ ] No unresolved debugging artifacts (`console.log`, `debugger`)
- [ ] TypeScript and linting stay enabled (disabling has a justification)
- [ ] Tests cover new or changed logic
- [ ] No sensitive data is exposed
- [ ] New dependencies are intentional and license-compatible
````
`````

## Rules

- **Description** is 2–5 sentences. Summarize the behavioral change and the reason. Do not list files — the diff view does that. No filler. No "This PR enhances…" patterns.
- **How to Test** contains steps a reviewer can execute. Each step is a command, a URL to visit, or an action to perform. The final step states the expected result.
- **Screenshots** section appears only when the diff touches UI files. It contains a placeholder that prompts the author to paste images. Do not start a dev server or capture screenshots.
- **Checklist** items are checked only when the diff evidence supports it. Unchecked items include a note.
- The output contains no explanation before or after the code block.
