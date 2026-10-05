# scheduled-pr-review

Runs one unattended first-pass review over all open pull requests (GitHub) or merge requests (GitLab) of a repository. Call it from a scheduled task, a cron job, or a loop. Each run continues where the last run stopped:

- It reviews only PRs with new commits. It waits for running CI, but not longer than `ci_wait_limit` (2 hours) after the head commit. It skips drafts, bot PRs, and stale PRs, and it reviews at most 5 PRs in one run.
- After round 1, it posts minor findings only on lines that changed since the last round. Serious findings always get through.
- It uses the CI results for lint, format, typecheck, unit tests, and build. It runs a check only when CI did not run it, and then only in a container without credentials, with resource limits, and without network after the dependency download, because the code of a PR can be hostile.
- It never posts the same finding twice, also when a teammate or another bot found it first.
- It keeps its state in one file for each project, so runs for different projects never overwrite each other. A run lock stops two runs for the same project from posting the same finding.

The actual review is done by [`pr-review`](../pr-review/README.md) in quick mode.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/scheduled-pr-review --global
```

It needs `pr-review` from the same toolkit, `jq`, and the `gh` CLI (GitHub) or the `glab` CLI (GitLab), signed in. For checks that CI does not run, it needs Docker (or a compatible runtime such as OrbStack). Without it, those checks are reported as "not run".

## Usage

Run it in the repository whose PRs you want to review:

```text
/jvm-skills:scheduled-pr-review
```

Override a setting in the invocation:

```text
/jvm-skills:scheduled-pr-review max_rounds=3 quiet_period=1h
```

| Setting | Default | Meaning |
| --- | --- | --- |
| `max_prs_per_run` | 5 | Review at most this number of PRs in one run. The others wait for the next run. |
| `max_rounds` | 5 | After this number of rounds, the PR gets no more automatic reviews. |
| `quiet_period` | 30 minutes | Skip a PR when its head commit is younger than this. |
| `ci_wait_limit` | 2 hours | Wait for running CI, but not longer than this after the head commit. |
| `max_age` | 30 days | Skip a PR when its head commit is older than this. |
| `include_bots` | false | Review PRs that a bot opened, for example dependency updates. |
| `include_own` | true | Review PRs that the current user opened. |
| `local_checks` | `container` | Where checks run that CI did not run: `container` or `off`. |

### As a scheduled task

Create a scheduled task in the repository (for example every 2 hours) with this prompt:

```text
Use the jvm-skills:scheduled-pr-review skill.
```

Start the task once by hand before you enable the schedule. Then you can approve the tools it needs (git, `gh` or `glab`, `jq`, `docker`, and writes to `~/.local/state/scheduled-pr-review/`), and later runs do not stop at a permission prompt.

## What it changes

- Inline comments on the PRs, for P0 to P2 findings only. Each comment ends with a hidden `scheduled-pr-review` marker.
- The state file `${XDG_STATE_HOME:-$HOME/.local/state}/scheduled-pr-review/<project key>.json`, and a lock folder next to it while a run works.

It adds no labels, assignments, approvals, or merges, and it never commits or pushes. The run report stays in the run.

### A lock from a crashed run

A run that crashes can leave its lock folder behind. Later runs for the same project then stop and report "lock not acquired". Make sure that no run for the project is active, then remove the lock folder:

```bash
rm -r "${XDG_STATE_HOME:-$HOME/.local/state}/scheduled-pr-review/<project key>.lock"
```

## Output

```text
scheduled-pr-review/
├── SKILL.md                  — Agent instructions: selection, delta, checks, filter, state
├── references/providers.md   — gh and glab commands, inline-comment recipes
└── README.md                 — This file
```

## When to use it

Use it for an automatic first pass on every open PR, before a human reviews. For a single PR that you want to review now, use `pr-review`.
