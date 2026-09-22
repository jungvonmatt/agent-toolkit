# start-ticket

Turns a ticket (Jira, Asana, Linear, GitHub Issues, GitLab Issues) into a ready-to-execute implementation plan. Fetches the ticket and its discussion read-only, optionally pulls the linked design spec, explores the codebase for impact and precedent, pressure-tests the requirement for gaps and edge cases, and writes a vertically-sliced plan in Simplified Technical English (ASD-STE100).

This skill is read-and-plan only. It does not implement, commit, or modify the ticket.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/start-ticket --global
```

## Usage

Point it at a ticket by URL, key, or number:

```text
Start ticket PROJ-123
```

```text
Start work on https://linear.app/acme/issue/ACME-42
```

```text
Start ticket #128
```

The agent will:

1. Resolve the ticket read-only and normalize its title, description, acceptance criteria, comments, and links.
2. Detect the project stack from repo evidence and adopt the matching engineer persona.
3. Pull the design spec when the ticket links one (Figma, Zeplin, screenshots).
4. Explore the codebase for impact and the closest existing pattern.
5. Pressure-test the requirement — completeness, edge-case sweep, assumption check.
6. Ask only the clarifying questions it cannot answer itself.
7. Write a vertically-sliced plan to `docs/plans/YYYY-MM-DD-<kebab-case-title>.md`, then verify every named identifier against the code.

## Output

```text
start-ticket/
├── SKILL.md                        — Agent instructions & workflow
├── references/
│   ├── plan-template.md            — Plan structure, slice map, execution log
│   ├── definition-of-done.md       — Standing quality gate for every task
│   ├── design-context.md           — How to extract a spec from a design source
│   ├── adr-template.md             — Architecture Decision Record shape
│   └── providers.md                — Provider commands and the normalized ticket shape
└── README.md                       — This file
```

## Relationship to the other skills

`write-ticket` produces the ticket; `start-ticket` turns it into a plan; `implement` executes that plan. They form a pipeline:

**write-ticket → start-ticket → implement → pr-description → pr-review**
