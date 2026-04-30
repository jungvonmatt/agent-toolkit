---
name: pr-review
description: Comprehensive pull request review for the current branch against a configurable target branch with severity-ranked findings, Jira requirement traceability, conditional accessibility checks, and deep performance analysis. Use when validating merge readiness, auditing regressions, preparing actionable review feedback, or checking implementation quality without changing code.
---

# PR Review Against Target Branch

Perform a deep review of the current branch against a target branch (e.g. `main`, `develop`, `integration`, `release/*`).
Keep the review read-only: do not modify code.

## Workflow

### 1. Establish the review baseline

- Confirm the active branch and determine the diff target (the "target branch").
- If the user did not pass a target branch in the prompt, ask first before doing anything else:
  `Which target branch should I review against? (e.g. main, develop, integration)`
- Only after the user has answered (or explicitly provided one in the prompt), continue.
- As a convenience, you may suggest a default in the question based on:
  1. Repository default branch via `git symbolic-ref refs/remotes/origin/HEAD` (strip `refs/remotes/origin/`).
  2. First match from common candidates that exists locally or on `origin`: `main`, `master`, `develop`, `integration`, `trunk`.
- Prefer merge-base comparison (`<target>...HEAD`) to review only branch-introduced changes.
- Use these baseline commands (replace `<target>` with the resolved branch):

```bash
git rev-parse --abbrev-ref HEAD
git fetch origin <target>
git diff --name-status <target>...HEAD
git diff --stat <target>...HEAD
git diff <target>...HEAD
pnpx fallow audit --base <target> --format json --quiet --explain || true
```

- If `git fetch` fails, fall back to the local ref `<target>` and report that limitation.
- If neither remote nor local ref exists, stop and report the missing target branch.
- If `fallow` is not installed, skip the audit step and note it in the report.

### 2. Ask for missing context

- Ask once at the beginning:
  `Is there a Jira ticket for this change? If yes, please share the key or link.`
- Ask for a runtime URL only if browser checks are needed and the default is not valid:
  `Should I use https://localhost:3000 or is there a different local setup?`

### 3. Load companion skills

Use all relevant skills that are available in the environment.

- Always use (if available): `code-review-and-quality`, `best-practices`, `performance` or `performance-optimization`, `fallow`.
- Use for runtime/browser validation (if available): `chrome-devtools` or `browser-testing-with-devtools`.
- Use conditionally: `a11y-debugging` only when UI, markup, interaction, or form changes are present in the diff.
- Read [`references/review-checklist.md`](references/review-checklist.md) for detailed criteria.

### 4. Execute the review

- Prioritize findings that can cause regressions, broken behavior, security issues, or poor user experience.
- Put special focus on performance risks.
- Check test quality and missing test coverage for changed behavior.
- If a Jira ticket exists, map implementation against each requirement and flag mismatches.

### 5. Run optional runtime checks

- Run runtime checks only when changes affect UI behavior, rendering, accessibility, runtime performance, or network usage.
- Use `https://localhost:3000` by default.
- If the app cannot be started or reached, explicitly report what was skipped and why.

### 6. Report findings clearly

- Follow [`references/reporting-template.md`](references/reporting-template.md).
- Order findings by severity (`P0` to `P3`).
- For each finding, include:
  - precise evidence (file and line)
  - impact and risk
  - concise recommendation
  - short example when useful
- If no major issues are found, state that explicitly and still list residual risks or test gaps.

## Guardrails

- Do not make any code changes.
- Do not use destructive git commands.
- Do not claim checks that were not run.
- Do not skip Jira alignment when a ticket is provided.
