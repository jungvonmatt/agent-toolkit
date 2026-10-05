---
description: Run one scheduled first-pass review over all open PRs/MRs
argument-hint: "[max_rounds=5] [local_checks=auto|container|off] [runtime_checks=off|trusted]"
---

Invoke the jvm-skills:scheduled-pr-review skill.

Run one unattended first-pass review over all open pull or merge requests of the
current repository. Review the full PR every round. Round 1 posts P0 to P2 findings.
Later rounds post P0 and P1 findings from anywhere in the PR, and P2 findings only
where the PR changed since the last round. Use the CI results before running checks
locally: trusted PRs in a worktree, all other PRs in a container.
