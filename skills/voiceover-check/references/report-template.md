# VoiceOver Check — Report Template

Quote VoiceOver verbatim, in the system language it used. Keep one row per check from [checks.md](checks.md).

```markdown
## VoiceOver check: <component> on <url>

**Browser:** <Safari | Chrome + VoiceOver> · **VoiceOver language:** <system language> · **Errors:** <real | simulated: how>

| Check | Expected | VoiceOver said | Result |
| --- | --- | --- | --- |
| <check> | <name, role, state> | `<verbatim phrase>` | Pass: 3/3 valid, 3 successful, 0 failed, 0 blocked |
| <check> | <name, role, state> | `<verbatim phrase>` | Fail: 3/3 valid, 1 successful, 2 failed, 0 blocked |
| <check> | <name, role, state> | `<verbatim phrase or no valid observation>` | Incomplete: 2/3 valid, 2 successful, 0 failed, 1 blocked: <reason> |

### Findings

1. **<what is wrong, in one line>** — <critical | serious | moderate | minor> · WCAG <criterion>
   - Heard: `<verbatim phrase>`
   - Cause: <element and attribute, verified in the same tab and state> — or: cause unverified
   - Fix: <one line> (modern-web-guidance: `<id>`, when used)

**Not checked:** <checks for this component from checks.md that were not run, and why>

**Incomplete:** <checks started but not completed, their blockers, and what remains to verify>

**Cleanup:** <VoiceOver stopped or user session preserved; launched browser closed or remaining blocker>

**Noticed outside the scope:** <one line per item heard outside the component, without severity or cause — or "none">

**Deviations:** <anything done differently from the skill, and why — or "none">
```

## Rules

- Keep an observed failure separate from its cause. Verify causes in the same test instance, tab, and state before closing it. Static source or another browser at the same URL may support a hypothesis, but cannot prove the runtime state.
- A usage hint ("You are currently on …", German "Du bist jetzt auf …") is never an item or a finding.
- Announcement checks pass only with 3 successful valid runs. Other checks use their planned count. Report completed/planned, successful, failed, and blocked counts explicitly. A valid failure is a finding. Missing repetitions or tooling interruptions without an observed failure mean incomplete, not fail. When a valid failure and a blocker coexist, report both.
- Do not claim the whole scope passed while required checks remain incomplete. Sampling the last phrase cannot prove every repeated identical or rapidly replaced announcement; disclose that limit when it affects the result.
- Mark a finding seen only in Chrome as "Chrome + VoiceOver" unless you confirmed it in Safari.
