# pr-description

Generates a pull/merge request description from the current branch diff. Writes concise, human-readable Markdown in Simplified Technical English (ASD-STE100) — no AI slop, no filler prose.

Auto-captures screenshots via Chrome DevTools when UI changes are detected.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/pr-description --global
```

## Usage

Run on any branch with uncommitted or committed changes:

```text
Generate a PR description
```

```text
Write a PR description for this branch
```

```text
PR description with screenshots
```

The agent will:

1. Analyse the diff, commits, and branch name.
2. Detect and fetch linked ticket context (Jira, GitHub Issues, GitLab Issues, Linear).
3. Use the project's PR/MR template if one exists, otherwise fall back to the default.
4. Capture before/after screenshots when UI files changed and DevTools is available.
5. Output copy-ready Markdown in a fenced code block.

## Output

```text
pr-description/
├── SKILL.md                  — Agent instructions & workflow
├── references/
│   └── output-template.md    — Description structure and formatting rules
└── README.md                 — This file
```

## Relationship to pr-review

`pr-description` produces the PR description before opening the PR.
`pr-review` reviews the PR after it is opened.

They form a pipeline: **implementation → pr-description → pr-review → merge**.
