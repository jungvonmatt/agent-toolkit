# Output Template

Write all prose in Simplified Technical English (ASD-STE100): one idea per sentence, ≤ 20 words for procedures, ≤ 25 for descriptions, active voice, present tense, articles kept, no gerunds, one term per concept. Code identifiers, paths, URLs, and commands are exempt — write them verbatim.

## Structure

Wrap the entire output in a single fenced code block opened with four backticks (` ````markdown `), so code blocks inside the description stay intact.

When a project PR/MR template exists, use its structure instead of this default. Add Shape, Evidence, and Merge Danger only when the project template has no section for the same content.

`````markdown
````markdown
## Description

<!-- 2–5 sentences: summarize what changed, why, and the user-facing effect. Reference ticket if one exists. The reviewer has the diff — do not list files or repeat code-level details. -->

## Shape

<!-- OPTIONAL. One small visual (≈15 lines) that shows the change faster than prose: pseudocode, call tree, component tree, file tree, Mermaid, or a `diff` sketch of the existing shape. Every node must exist in the diff. Omit this entire section when the visual adds nothing. -->

```diff
 <ParentComponent>
   <ExistingChild>
+  <NewChild />
```

## Evidence

<!-- Before/after proof. Name the exact test, command, or CI run. Report a result only when it actually ran; otherwise mark it `not run`. -->

- **Before:** <failing test, wrong output, or screenshot>
  **After:** <passing test, correct output, or screenshot>

<!-- Include the table ONLY when the diff touches UI files and no screenshots exist yet. -->

_UI changed. Paste before/after screenshots here._

| Before | After |
|--------|-------|
|        |       |

## Merge Danger

**Door:** <one-way | two-way> — <for one-way: what a revert does not undo>

**Blast radius:** <short scope phrase> — <concrete ramifications, if any>

<!-- Include ONLY when a prerequisite failed. Omit when every prerequisite passes. -->

**Before merge:**

- <failed prerequisite and where>

## How to Test

<!-- Actionable steps a reviewer can follow. End with an expected result. -->

1. …
2. …
3. Expected result: …
````
`````

## Rules

- **Description** is 2–5 sentences. Summarize the behavioral change and the reason. Do not list files — the diff view does that. No filler. No "This PR enhances…" patterns.
- **Shape** is optional. Use one visual, about 15 lines, with only nodes that exist in the diff. Use a text tree or `diff` sketch on Bitbucket, which does not render Mermaid.
- **Evidence** shows a before and an after. Prefer screenshots for visual changes, then test runs and command output. When no evidence exists, state it in one line.
- **Merge Danger** always states the door and the blast radius. A low-risk change needs one line: `**Door:** two-way. **Blast radius:** one component.`
- **Before merge** lists only failed prerequisites (secrets, debugging artifacts, missing tests, disabled checks, accidental dependencies).
- **How to Test** contains steps a reviewer can execute. Each step is a command, a URL to visit, or an action to perform. The final step states the expected result.
- **Checklist** appears only when the project template has one. Tick an item only when the diff proves it, and add a short note to unticked items.
- The output contains no explanation before or after the code block.
