# VoiceOver Check — Report Template

Quote VoiceOver verbatim, in the system language it used. Keep one row per check from [checks.md](checks.md).

```markdown
## VoiceOver check: <component> on <url>

**Browser:** <Safari | Chrome + VoiceOver> · **VoiceOver language:** <system language> · **Errors:** <real | simulated: how>

**Mode:** <full | targeted> · **Scope:** <feature, owned interactions, represented consumers, exclusions>

**Context:** <manual | review handoff> · **Prior knowledge:** <requirements, diff, earlier browser inspection, or none>

**Elapsed time:** <measured setup/navigation, checks, verification durations, or not measured; no time cutoff>

| Check | Expected | VoiceOver said | Result |
| --- | --- | --- | --- |
| <check> | <name, role, state> | `<verbatim phrase>` | Pass: 1/1 valid, 1 successful, 0 failed, 0 blocked |
| <check> | <name, role, state> | `<verbatim phrase>` | Fail: 2/2 valid, 1 successful, 1 failed, 0 blocked; follow-up reason: <reason> |
| <check> | <name, role, state> | `<verbatim phrase or no valid observation>` | Incomplete: 0/1 valid, 0 successful, 0 failed, 1 blocked: <reason> |

### Findings

1. **<what is wrong, in one line>** — <critical | serious | moderate | minor> · WCAG <criterion>
   - Heard: `<verbatim phrase>`
   - Repro by hand: <VoiceOver keys a person presses, from "Reproduce by hand" below>
   - Cause: <element and attribute, verified in the same tab and state> — or: cause unverified
   - Attribution: <baseline comparison proves introduced | pre-existing | introduction unverified>
   - Fix: <one line> (modern-web-guidance: `<id>`, when used)

**Not checked:** <checks for this component from checks.md that were not run, and why>

**Other screen readers:** <untested: NVDA, JAWS, TalkBack, iOS VoiceOver — name the custom widgets or live regions most at risk, or "low risk: native elements only">

**Incomplete:** <checks started but not completed, their blockers, and what remains to verify>

**Cleanup:** <VoiceOver stopped or user session preserved; launched browser closed or remaining blocker>

**Noticed outside the scope:** <one line per item heard outside the component, without severity or cause — or "none">

**Deviations:** <anything done differently from the skill, and why — or "none">
```

## Rules

- Keep an observed failure separate from its cause. Verify causes in the same test instance, tab, and state before closing it. Static source or another browser at the same URL may support a hypothesis, but cannot prove the runtime state.
- A usage hint ("You are currently on …", German "Du bist jetzt auf …") is never an item or a finding.
- Apply Step 6 of [../SKILL.md](../SKILL.md) to execution counts. Report completed/planned, successful, failed, and blocked counts, plus reasons for follow-ups or an explicit repetition requirement. Different states are separate scenarios. A valid failure cannot become a pass through retries; when a failure and a blocker coexist, report both. A successful 1/1 is not a reliability claim.
- Limit the verdict to the tested scope and represented contexts. Code-informed targeted checks are guided, not blind discovery. Attribute a failure to a PR only with baseline evidence; otherwise mark its introduction unverified.
- Do not claim the whole scope passed while required checks remain incomplete. Sampling the last phrase cannot prove every repeated identical or rapidly replaced announcement; disclose that limit when it affects the result.
- Mark a finding seen only in Chrome as "Chrome + VoiceOver" unless you confirmed it in Safari.

## Reproduce by hand

Developers reproduce findings with the keyboard. Translate the `vo.sh` steps of each finding into these default keys (VO = Control + Option). These keys are for the person reading the report; the agent never sends them.

| `vo.sh` step | VoiceOver keys |
| --- | --- |
| Start or stop VoiceOver | Command + F5 |
| `walk` / `back` | VO + Right Arrow / VO + Left Arrow |
| `act` | VO + Space |
| `into` / `out` | VO + Shift + Down Arrow / VO + Shift + Up Arrow |
| `last` | VO + Z (repeat last phrase) |
| `do "find next heading"` / `"… link"` / `"… form control"` / `"… table"` | VO + Command + H / L / J / T |
| `do "escape"` | Escape |
| Landmarks and other lists | VO + U (rotor), Left/Right to switch lists |
