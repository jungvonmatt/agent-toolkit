# implement

Executes a `start-ticket` implementation plan task-by-task. Builds, tests, and verifies each vertical slice, then — in the default mode — pauses for a human to review the working-tree diff **before** every commit. The reviewer reads the live change in their own tool (VS Code, a diff viewer, `git diff`) and approves; the commit records an already-reviewed change. Add `auto` to run the whole plan in one approved pass.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/implement --global
```

## Usage

Run in a repo that has a plan under `docs/plans/` (written by `start-ticket`):

```text
Implement the plan
```

```text
/jvm-skills:implement
```

Run the whole plan in one pass, with a single up-front approval:

```text
/jvm-skills:implement auto
```

### Modes

- **default** (`/implement`) — implement the next pending task, pause before the commit for a working-tree review, commit only after approval, then stop. One slice at a time.
- **auto** (`/implement auto`) — one approval on the whole plan, then every task runs without stopping between them. The per-task human gate is removed; only the plan's own review gates, risk triggers, and blockers still pause before their commit.

## What it does

1. Locates the plan under `docs/plans/` and confirms a clean git baseline.
2. Picks the next pending task, loads its acceptance criteria, files, edge cases, and dependencies.
3. Runs a test-driven loop — failing test (RED) → minimum code (GREEN) → full suite → build → runtime check.
4. Confirms both bars: the task's acceptance criteria and the standing Definition of Done.
5. **Default mode:** presents a review packet and waits for approval on the working-tree diff, then commits.
6. Respects the plan's phases, checkpoints, review gates, and `[TENTATIVE]` decisions.

## How it differs from a plain build loop

The human review gate lands **before** the commit, not after. The change stays in the working tree so a reviewer reads a live diff instead of committed history — easier to review in VS Code and other tools, and no amend or reword after the fact.

## Output

```text
implement/
├── SKILL.md                    — Agent instructions & workflow
├── references/
│   └── review-packet.md        — The pre-commit review-packet template & rules
└── README.md                   — This file
```

## Relationship to start-ticket

`start-ticket` produces the plan; `implement` executes it. They form a pipeline:

**write-ticket → start-ticket → implement → pr-description → pr-review**
