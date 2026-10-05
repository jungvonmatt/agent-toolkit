---
description: Run one scheduled first-pass review over all open PRs/MRs
argument-hint: "[max_rounds=5] [max_prs_per_run=5] [copy_files=\".env localhost-key.pem localhost.pem\"]"
---

Invoke the jvm-skills:scheduled-pr-review skill.

Run one unattended first-pass review over all open pull or merge requests of the
current repository. Review the full PR every round. Round 1 posts P0 to P2 findings.
Later rounds post P0 and P1 findings from anywhere in the PR, and P2 findings only
where the PR changed since the last round. Review only trusted PRs, each in a
worktree with the project's env files; use the CI results before running checks there.
