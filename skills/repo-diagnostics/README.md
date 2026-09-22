# repo-diagnostics

Runs five git-based diagnostics that give a structural picture of a codebase before opening any files. Reveals churn hotspots, bus factor, bug clustering, commit velocity, and crisis frequency, then synthesizes the results into a short findings summary. Use it when onboarding to an unfamiliar repo or auditing technical health.

Read-only: it runs `git log` / `git shortlog` queries and reports. It changes nothing.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/repo-diagnostics --global
```

## Usage

Run it in a repo, or point it at a path:

```text
Run repo diagnostics
```

```text
Diagnose the health of this repository
```

```text
Repo diagnostics for ./packages/api
```

The agent will:

1. **Churn hotspots** — the most-modified files in the last year.
2. **Bus factor** — contributor concentration, historical vs. recent.
3. **Bug clusters** — files most often touched in bug-fix commits.
4. **Commit velocity** — commits per month, read as a trend.
5. **Crisis frequency** — reverts, hotfixes, rollbacks over the last year.

It cross-references the lists — a file that is high-churn, bug-prone, and complex is the top refactoring target — and reports the findings with the caveats each metric carries (for example, squash-merge workflows distort authorship).

## Output

```text
repo-diagnostics/
├── SKILL.md    — Agent instructions & the five diagnostics
└── README.md   — This file
```

## When to use it

Run it first when you join a codebase or before a larger change, ahead of `start-ticket`, so the plan accounts for the repo's real risk areas.
