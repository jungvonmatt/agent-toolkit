# scheduled-pr-review

Runs one unattended first-pass review over the open pull requests (GitHub) or merge requests (GitLab) of a repository. Call it from a scheduled task, a cron job, or a loop. Each run continues where the last run stopped:

- It reviews only trusted PRs: the author has write access, the branch is in the same repository, and the author is not a bot. It skips all other PRs and lists them in the report.
- It reviews only PRs with new commits. It waits for running CI, but not longer than `ci_wait_limit` (2 hours) after the head commit. It skips drafts and stale PRs, and it reviews at most 5 PRs in one run.
- It checks out each PR in a temporary worktree, copies the env and certificate files of the project into it, and lets [`pr-review`](../pr-review/README.md) review the code and check the running app in a browser.
- It uses the CI results for lint, format, typecheck, unit tests, and build, and runs a check in the worktree only when CI did not run it.
- After round 1, it posts minor findings only on lines that changed since the last round. Serious findings always get through.
- It never posts the same finding twice, also when a teammate or another bot found it first.
- It keeps its state in one file for each project. A run lock stops two runs for the same project from posting the same finding, and it frees itself 90 minutes after a crash.
- Heavy steps (install, checks, the running app with a browser) take turns through a machine lock. On macOS, critical memory pressure or high CPU load makes a step wait. Normal and warning memory pressure allow it. When measurement fails, the review continues with a warning. The machine lock and `nice -n 10` still apply. When measured overload lasts 30 minutes, the PR waits for the next run.
- It does not write to the agent memory. The state file and the report are the only record of a run.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/scheduled-pr-review --global
```

It needs `pr-review` from the same toolkit, `jq`, and the `gh` CLI (GitHub) or the `glab` CLI (GitLab), signed in.

## Usage

Run it in the repository whose PRs you want to review:

```text
/jvm-skills:scheduled-pr-review
```

Override a setting in the invocation:

```text
/jvm-skills:scheduled-pr-review max_rounds=3 copy_files="config/dev.keystore"
```

Choose which PRs to review:

```text
/jvm-skills:scheduled-pr-review review_scope=all
/jvm-skills:scheduled-pr-review review_scope=exclude-own
/jvm-skills:scheduled-pr-review review_scope=assigned
```

`all` is the default. `exclude-own` skips your PRs. `assigned` selects PRs where the signed-in account is directly assigned as reviewer. Assignees and team requests do not count. On GitHub, this means a pending personal review request, not a review already submitted. All other selection rules still apply, including `prs` and the limit per run.

Env files (`.env` and `.env.*`) and certificates or keys (`.pem`, `.crt`, `.cer`, `.key`, `.p12`, `.pfx`) are discovered automatically, including in subfolders and when ignored by Git. The copy keeps relative paths and skips tracked files, dependencies, build outputs, caches, and symlinks. It never overwrites an existing worktree file. Use `copy_files` for extra local files with other names.

| Setting | Default | Meaning |
| --- | --- | --- |
| `max_prs_per_run` | 5 | Review at most this number of PRs in one run. The others wait for the next run. |
| `prs` | all | Review only these PR numbers, for example `prs=43`. For a test or a manual rerun. |
| `max_rounds` | 5 | After this number of rounds, the PR gets no more automatic reviews. |
| `quiet_period` | 30 minutes | Skip a PR when its head is younger than this. |
| `ci_wait_limit` | 2 hours | Wait for running CI, but not longer than this after the head commit. |
| `max_age` | 30 days | Skip a PR when its last update is older than this. |
| `review_scope` | `all` | `all`, `exclude-own`, or `assigned`: all authors, other authors only, or your direct reviewer assignments. |
| `include_own` | true | Legacy setting. Without explicit `review_scope`, `false` selects `exclude-own` and `true` selects `all`. |
| `headroom_wait` | 30 minutes | How long a heavy step waits for measured overload to end. Measurement failures do not make it wait. |
| `copy_files` | empty | Extra local files to copy in addition to automatic env and certificate discovery. Paths are relative to the main checkout and can include subfolders. |
| `provider` | `auto` | Set `github` or `gitlab` for a host whose name does not show the provider (GitHub Enterprise, self-managed GitLab). |

### As a scheduled task

Create a scheduled task in the repository (for example every 2 hours) with this prompt:

```text
Use the jvm-skills:scheduled-pr-review skill.
```

Start the task once by hand before you enable the schedule. Then you can approve the tools it needs (git, `gh` or `glab`, `jq`, the package manager, and writes to `~/.local/state/scheduled-pr-review/`), and later runs do not stop at a permission prompt.

## What it changes

- Inline comments on the PRs, for P0 to P2 findings only. Each comment ends with a hidden `scheduled-pr-review` marker.
- The state file `${XDG_STATE_HOME:-$HOME/.local/state}/scheduled-pr-review/<project key>.json`, a lock folder next to it while a run works, and the folder `machine.lock` during a heavy step.
- A temporary worktree for each reviewed PR, with copies of local env files, certificates, and the extra files of `copy_files`. It removes the worktree after the review, also after a failure.

It adds no labels, assignments, approvals, or merges, and it never commits or pushes. The run report stays in the run.

## Output

```text
scheduled-pr-review/
├── SKILL.md                  — Agent instructions: trust, selection, delta, checks, filter, state, lock
├── references/providers.md   — gh and glab commands, inline-comment recipes
└── README.md                 — This file
```

## When to use it

Use it for an automatic first pass on every open PR of your team, before a human reviews. For a single PR that you want to review now, use `pr-review`.
