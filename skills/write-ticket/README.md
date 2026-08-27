# write-ticket

Turns a raw idea, bug report, or feature request into a development-ready ticket. Acts as a product coach: finds weak spots in the initial description, asks targeted questions, and refines the requirements together with the author — written in Simplified Technical English (ASD-STE100) with auto-derived type, acceptance criteria, and everything a developer needs to start work.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/write-ticket --global
```

## Usage

Describe what you need in plain language:

```text
Write a ticket: users lose their cart when they switch language on the checkout page
```

```text
Write a ticket for adding dark mode support to the settings page
```

```text
Turn this into a proper ticket: "the search is slow when there are many filters"
```

The agent will:

1. Ask targeted questions to find weak spots in the description (missing edge cases, unclear roles, undefined error behavior).
2. Derive the ticket type (`bug`, `task`, `story`, `spike`, `epic`) automatically.
3. Produce a development-ready ticket in Markdown — clear enough for a developer to start without further questions.
4. Optionally push the ticket to a provider on explicit request.

## Output

```text
write-ticket/
├── SKILL.md                  — Agent instructions & workflow
├── references/
│   ├── ticket-template.md    — Ticket structure and formatting rules
│   └── type-heuristics.md    — Type derivation decision table
└── README.md                 — This file
```

## Relationship to start-ticket

`start-ticket` consumes an existing ticket and produces an implementation plan.
`write-ticket` produces the ticket itself from unstructured input.

They form a pipeline: **write-ticket → start-ticket → implementation**.
