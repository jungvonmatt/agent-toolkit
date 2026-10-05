---
description: Run one scheduled first-pass review over all open PRs/MRs
argument-hint: "[max_rounds=5] [quiet_period=30m] [ci_wait_limit=2h]"
---

Invoke the jvm-skills:scheduled-pr-review skill.

Run one unattended first-pass review over all open pull or merge requests of the
current repository. Review only what changed since the last run, use the CI results
before running checks locally, and post P0 to P2 findings as inline comments.
