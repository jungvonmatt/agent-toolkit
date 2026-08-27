# Type Heuristics

Derive the ticket type from the user's input. Apply the first rule that matches.

## Decision table

| Signal in the input                                                        | Type      |
|---------------------------------------------------------------------------|-----------|
| Reports wrong behavior, regression, crash, error, or data loss             | `bug`     |
| Describes a user-facing capability or workflow with business value          | `story`   |
| Requests investigation, research, proof-of-concept, or a technical question| `spike`   |
| Groups multiple related stories or spans several sprints                   | `epic`    |
| Everything else: refactor, chore, config, infra, dependency, automation    | `task`    |

## Disambiguation rules

- A **bug** always has a deviation: current behavior ≠ expected behavior. If the user describes something that "does not work" but no correct behavior was ever defined, it is a `story` (new capability) or a `task` (missing implementation), not a bug.
- A **story** delivers value to an end user or stakeholder. Internal tooling improvements without direct user impact are a `task`.
- A **spike** produces knowledge, not shippable code. Its deliverable is a decision, document, or prototype — not a feature.
- An **epic** is a container. Prefer breaking it into stories and tasks unless the user explicitly wants a single high-level ticket.
- When the input contains both a bug report and a feature request, split into separate tickets and flag the split to the user.

## Sizing and splitting

After deriving the type, assess whether the work fits a single ticket:

- If the input bundles **multiple independently shippable outcomes**, split into separate tickets and declare blocking edges between them.
- If the work spans **more than one vertical slice** (schema + API + UI + tests), break it into sub-tickets using the vertical-slicing rules in `SKILL.md` Step 5b.
- A single ticket should be completable in **one focused session** (a few hours to a day). If it feels larger, it is an epic or needs splitting.

When you split, flag the split to the user and explain the rationale.

## Confidence

State the derived type with a one-line rationale and confidence:

```text
Type: bug (high confidence) — the user reports a crash when the filter resets.
Type: story (medium confidence) — the input describes a new flow, but it may also be a missing implementation (task). Override if needed.
```

If confidence is low, present two candidates and ask the user to choose.
