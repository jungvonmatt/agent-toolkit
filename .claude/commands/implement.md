---
description: Execute an implementation plan task-by-task — build, test, review before commit
argument-hint: "[auto to run the whole plan; else the next task only]"
---

Invoke the jvm-skills:implement skill.

Execute the ready-to-execute plan from docs/plans/ (written by start-ticket) one task
at a time — build, test, and verify each vertical slice. In the default mode, pause
before every commit so a human reviews the working-tree diff, then commit only after
approval. Pass "auto" to run the whole plan in one approved pass, pausing only at the
plan's review gates, risk triggers, and blockers.
