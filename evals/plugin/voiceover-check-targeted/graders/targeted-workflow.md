---
type: llm
---

PASS only if the reply meets all of these:

- Supports a manual targeted feature check without a Git diff or PR. Preserves the requested open Chrome tab. Asks for consent before starting VoiceOver.
- Plans one valid run per distinct state/check by default in both full and targeted modes. Invalid submission and success are different scenarios, not repetitions. Repeats only the affected step for a concrete uncertainty, failure investigation, or explicit reliability requirement. Never erases a valid failure with a later success. Reports actual counts and does not claim reliability from 1/1.
- Imposes no total time budget or time-based cutoff. Completes the agreed scope or reports a real blocker. Retains safety stops and bounded navigation attempts. A standalone request with no component still defaults to the whole page.
- Defines targeted scope around the user flow, including entry, relevant owned interactions, local reading order, and focus return. Excludes unrelated destinations. Considers affected consumers of shared components rather than only changed lines.
- The attended full PR review loads voiceover-check for relevant screen-reader behavior and passes URL/browser/state, affected feature/consumers, scenarios, requirement-backed expectations, and boundaries. Identifies it as a guided check, not blind discovery. Prior code knowledge is disclosed and is not evidence that the expected announcement actually occurred.
- The orchestrator obtains consent and owns real VoiceOver. It defers browser automation until VoiceOver is off, including a concurrently planned runtime worker. Static code review may run independently. No DOM-based navigation or pre-inspection supplies labels for the VoiceOver pass.
- Quick mode skips runtime including VoiceOver. Unattended/scheduled reviews never start it. Missing tools, denied consent, and incomplete required checks are reported explicitly rather than passed. A failure is attributed to the PR only with baseline evidence.

FAIL if any condition above is missing or contradicted, especially automatic three-run checks, time-budget termination, full-page testing for the named module, or parallel browser automation during VoiceOver.