# Plan Template

Save to `docs/plans/YYYY-MM-DD-<kebab-case-ticket-title>.md` (today's date).

Write all prose in Simplified Technical English (ASD-STE100): one instruction per sentence, ≤ 20 words for procedures and ≤ 25 for descriptions, active voice, imperative for steps, present tense, articles kept, no gerunds, and one term per concept throughout. Code, paths, and commands are written verbatim.

## Structure

```markdown
# <Ticket title> — Implementation Plan

> **For the executor:** Use an executing-plans workflow to implement this plan task-by-task.

**Ticket:** [<id>](<url>)
**Goal:** <1–2 sentence summary of what to build and why>
**Tech stack:** <detected stack — framework, language, styling, key libs>

**Design references:** (if any)
- [<description> (node <id>)](<url>)

**Acceptance criteria:** (per-ticket — "did we build the right thing?")
- [ ] <criterion 1>
- [ ] <criterion 2>

**Definition of Done:** (standing gate — "is it ready?" — see [`definition-of-done.md`](definition-of-done.md))
- <cite the project's DoD if one exists, else the baseline from the reference>
- Every task must clear both its acceptance criteria and this DoD.

**Skills consulted:** <comma-separated list>

---

## Requirement gaps & decisions

> From Step 4b. The ticket's acceptance criteria remain the contract; this records what the ticket left unstated and any refinements agreed with the user.

**Assumptions checked:**
- <ticket assumption> → <holds / contradicted by `<file>` / confirmed with user>

**Edge cases the ticket omitted (now covered):**
- <state the ticket didn't cover — empty, error, permission, concurrency, i18n, …> → <how the plan handles it>

**Alternative approach agreed:** (only if the codebase pointed to a different technical route to the same Expected Result)
- <ticket's implied approach> vs. <alternative> → <chosen + why, confirmed with user>

---

## Key design / architecture decisions

| Area | Decision | Confidence |
|---|---|---|
| … | … | `[FIRM]` or `[TENTATIVE]` |

> `[FIRM]` = backed by ticket, design spec, or established project pattern.
> `[TENTATIVE]` = assumption — validate before relying on it.

---

## Slice map

> Vertical slices ordered by risk, then dependency. Each task is one slice. Each phase ends at an observable checkpoint. See Step 6b.

**Dependency graph:**

```text
Task 1 ──→ Task 2 ──→ Task 4
           └──→ Task 3 ──→ Task 5
```

**Phases and checkpoints:**

| Phase | Tasks | Ends at checkpoint (observable outcome) | Review gate? |
|---|---|---|---|
| 1 — <name> | T1 | <what a person can see or run> | — |
| 2 — <name> | T2, T3 | <…> | human review |
| 3 — <name> | T4, T5 | <feature complete> | — |

**Acceptance-criterion → checkpoint trace:** (every criterion has a named place where a checkpoint proves it)

| Acceptance criterion | Proved at |
|---|---|
| <criterion 1> | Checkpoint A (Task 1) |
| <criterion 2> | Checkpoint C (Task 5) |

---

## Phase 1 — <name>

## Task 1 — <Short title>

**Files:** `<relative/path>`, `<test path>`, `<story path if applicable>`
**Why:** <1 sentence>
> **Depends on:** Task N  ← only if applicable

<Behavioral description: what it does, how it integrates with existing code, which pattern to follow.>

**API:** (for new components / modules / endpoints)

interface Props { /* types + defaults */ }
interface Emits { /* signatures */ }

> Define *what* and *why*, not template-level *how*. No full templates, exhaustive class lists, or complete story code — the implementer writes the actual code.

**Edge cases & fallbacks:**
- <empty / loading / error state>
- <missing translations, overflow, boundary conditions>
- <fallback if the approach doesn't hold>

**Steps:**
1. Implement (+ story if the project uses one).
2. Verify manually (Storybook/dev server) against design and edge cases; revisit `[TENTATIVE]` decisions.
3. Write 3–5 targeted tests (or write them first, TDD, when behavior is well-defined).
4. Commit: `<type>(scope): <description>`.

**Acceptance:**
- [ ] … (task-specific criteria)
- [ ] Definition of Done cleared (Correctness + Quality at minimum)

---

### Checkpoint A — <observable outcome>

> The named, observable result that proves this phase. State exactly what a person sees or runs (a screen renders, a flow works end-to-end). Mark as a human review gate when direction must be confirmed before later phases depend on it.

- [ ] <what to observe in the browser / runnable app / passing end-to-end test>
- [ ] Acceptance criteria proved here: <list>

---

> Repeat the `## Phase` → `## Task` → `### Checkpoint` pattern for each phase. Keep each task a small vertical slice.

## Task N (final) — Verification

Run the project's a11y / quality checks against all new/modified surfaces and fix issues before completing. For UI work, load `a11y-debugging` if available. Confirm the full **Definition of Done** for every task, and every ticket acceptance criterion, before you call the work complete.
```

## Plan quality rules

- Each task is independently executable unless a `> **Depends on:** Task N` note says otherwise.
- **Slice vertically.** Each task cuts through the stack to make one behavior observable; no task is a lone horizontal layer (all types, all services, or all UI).
- Group tasks into phases; every phase ends at a named checkpoint with an observable outcome.
- Order slices by risk first, then by dependency — the biggest unknown ships first, so a wrong assumption fails fast.
- Every ticket acceptance criterion maps to a checkpoint that proves it.
- Use exact, project-root-relative file paths.
- **Platform-native first** — native HTML/CSS/browser APIs over libraries, especially for a11y and performance.
- For new components, include TypeScript prop/emit interfaces — not full templates or class lists.
- Include i18n keys (in the project's key style) when translations are needed.
- For new endpoints/handlers, include the signature and the context fields used.
- No arbitrary styling values — use design tokens; add a token-creation task first if one is missing.
- Each task bundles: implement → verify → test → commit.
- List edge cases and fallbacks per task, not just the happy path.
