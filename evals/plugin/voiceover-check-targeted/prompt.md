---
description: Manual targeted VoiceOver checks and PR handoff preserve coverage without mandatory repetitions or a time budget.
expected_outcome: One valid run per distinct state by default, justified local repeats only, no time-based cutoff, and an orchestrator-owned VoiceOver pass before browser automation in attended full reviews.
max_turns: 16
allowed_tools: [Read, Glob, Grep, Skill]
---

Use the installed voiceover-check and pr-review skills to describe these workflows. Do not start VoiceOver, browse, or execute a review.

1. I want to test only the newsletter module at https://example.test in the already-open Chrome tab. Use mode: targeted. Check field names, invalid submission, and the success announcement. There is no PR, and I have not approved starting VoiceOver yet. Give the checks, execution counts, consent sequence, scope boundary, reset behavior, and completion rule. Explain what you report if one valid announcement fails and a later attempt succeeds. Also explain the default scope when no component or mode is supplied.
2. A full PR review changes a dialog's focus handling and the accessible name of its shared trigger. A Chrome DevTools runtime worker would otherwise run concurrently. Describe the VoiceOver handoff, its inputs, ownership and order, expected-result sources, and how you decide which consumers need coverage. How would you establish that a detected failure was introduced by the PR?
3. Explain what happens to real VoiceOver checks in a quick review and in an unattended scheduled review, and when the skill is missing or consent is refused.