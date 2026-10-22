# pr-review

Performs a read-only, evidence-driven review of a change against its target branch. Web-first, but it also handles Node servers, CLIs, edge runtimes, build code, and shared libraries. Covers regressions, security, performance, accessibility, and requirement compliance, and reports severity-ranked findings with `file:line` references.

The review is read-only. It never modifies code, comments, tickets, branches, or merge state.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/pr-review --global
```

## Usage

Review the current PR/MR, or a local branch against a target:

```text
Review this PR
```

```text
Review local branch against main
```

```text
Review local branch against main with ticket PROJ-123
```

Modes and depths:

- **PR/MR mode** — remote change metadata plus a local checkout for the primary diff.
- **Local mode** — current checkout plus a required target branch and optional ticket context.
- **Full** (default) — parallel specialist fan-out, runtime checks, aggregation. For UI changes, runtime includes a browser accessibility audit (keyboard, focus, contrast, Lighthouse) and performance measurement (LCP, CLS, INP, network) on affected routes.
- **Quick** — parallel specialist fan-out and aggregation, runtime skipped.

Web UI changes are also checked against
[`modern-web-guidance`](https://github.com/GoogleChrome/modern-web-guidance)
for native platform features and obsolete patterns. It runs through `npx`, so
it does not need to be installed.

In an attended full review, changes to names, roles, focus, dialogs, live
announcements, or screen-reader navigation trigger a targeted
[`voiceover-check`](../voiceover-check/SKILL.md) when available. The review
passes the affected flow, relevant consumers, scenarios, expectations, and
scope boundaries. The orchestrator asks for consent and runs VoiceOver before
browser automation. Each distinct state is checked once by default, with
justified local repeats and no total time budget. Quick and unattended reviews
never start VoiceOver. Missing capability or consent is reported as missing
coverage, not a pass.

The agent will:

1. Resolve the change, target branch, and any linked ticket.
2. Classify the changed code, then fan out to the relevant specialist checks.
3. Run tests, typecheck, lint, build, and runtime/browser checks where possible.
4. Aggregate findings, ordered by severity, with evidence and a concrete fix direction.
5. Trace each requirement to implementation evidence when a ticket or PR description is available.

## Output

```text
pr-review/
├── SKILL.md                        — Agent instructions & workflow
├── references/
│   ├── reporting-template.md       — Verdict, findings, checks, traceability structure
│   ├── review-checklist.md         — Per-axis review checklist
│   ├── reviewer-persona.md         — The reviewer's stance and priorities
│   └── subagent-contract.md        — Contract for the specialist review subagents
└── README.md                       — This file
```

## Relationship to the other skills

`pr-review` closes the loop after `implement` and `pr-description`:

**write-ticket → start-ticket → implement → pr-description → pr-review**
