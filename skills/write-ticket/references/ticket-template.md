# Ticket Template

Write all prose in Simplified Technical English (ASD-STE100): one instruction per sentence, ≤ 20 words for procedures and ≤ 25 for descriptions, active voice, present tense, articles kept, no gerunds, and one term per concept throughout. Code, paths, URLs, and commands are written verbatim.

## Structure

````markdown
## <Type>: <Title>

> **Type:** `<bug | task | story | spike | epic>` — <one-line rationale for the derived type>

### Description

<State the problem, need, or goal. Use 2–4 sentences.>

<For bugs: describe the current (incorrect) behavior and the expected (correct) behavior.>

<For stories: describe the user need and the value it delivers.>

### Reproduction steps (bugs only)

1. <Step 1>
2. <Step 2>
3. <Observe: …>

**Environment:** <browser, OS, device, API version, or deploy target — whatever applies>

### Acceptance criteria

- [ ] <Criterion 1 — testable, binary pass/fail>
- [ ] <Criterion 2>
- [ ] <Edge case or error-path criterion>

> Each criterion is a single sentence. It starts with a verb. It describes an observable outcome, not an implementation detail.

### User stories (stories and epics)

> Include for `story` and `epic` types. Each story follows the format below.

1. As a <role>, I want <capability>, so that <benefit>.
2. As a <role>, I want <capability>, so that <benefit>.

> Cover all aspects of the feature: happy path, edge cases, error handling, and different user roles.

### Out of scope

- <At least one item this ticket does not cover>

### Design references (required for UI-facing tickets)

> Every ticket that changes what the user sees must include at least one design reference. Acceptable: Figma link, screenshot, mockup image, reference to an existing page, or a written description of the expected visual result.

- [<description>](<url>)

### Security considerations (if applicable)

- <Data handling, auth, or input-validation concern>

### Sub-tasks (if applicable)

> For vertical-slice breakdowns, use separate sub-tickets (see SKILL.md Step 5b) instead of this checklist. Use this checklist only for small, same-ticket work items.

- [ ] <Sub-task 1>
- [ ] <Sub-task 2>

### Blocked by / blocks (if applicable)

- Blocked by: <ticket ID or description>
- Blocks: <ticket ID or description>

---

**Priority:** `<critical | high | medium | low>` — <rationale>
**Labels:** <comma-separated>
**Components:** <affected areas>
**Estimate:** <S | M | L or story points> — <rationale>
````

## Template rules

- The title uses an imperative verb, names the object, and gives context. Maximum 12 words.
- The description answers: who is affected, what is the problem or need, and why it matters. Write from the user's perspective, not the developer's.
- Acceptance criteria are mandatory. Include 3–7 items: happy-path outcomes, at least one edge-case or error-path criterion, and one accessibility criterion (for UI tickets). Consolidate related checks into a single criterion.
- Each acceptance criterion is testable by a human or automated test without further clarification.
- Each acceptance criterion describes an observable outcome, not an implementation detail.
- User stories appear for `story` and `epic` types. Each story covers one actor–capability–benefit triple.
- Out of scope names at least one thing the ticket does not cover. Every out-of-scope item must come from the author's explicit input or be confirmed by the author when asked. Do not invent exclusions.
- Security considerations appear whenever the change touches user data, login, or personal information.
- Metadata (priority, labels, estimate) is a suggestion the author can override.
- Do not include implementation details, file paths, or technical architecture decisions — those are the developer's domain.
- **Never add** an "Implementation notes", "Technical notes", or "Developer hints" section. The ticket describes the *what*, never the *how*.
