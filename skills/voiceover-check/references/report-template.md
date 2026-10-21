# VoiceOver Check — Report Template

Quote VoiceOver verbatim, in the system language it used. Keep one row per check from [checks.md](checks.md).

```markdown
## VoiceOver check: <component> on <url>

**Browser:** <Safari | Chrome + VoiceOver> · **VoiceOver language:** <system language> · **Errors:** <real | simulated: how>

| Check | Expected | VoiceOver said | Result |
| --- | --- | --- | --- |
| <check> | <name, role, state> | `<verbatim phrase>` | ✅ pass, 3 of 3 |
| <check> | <name, role, state> | `<verbatim phrase>` | ❌ fail, 1 of 3 |

### Findings

1. **<what is wrong, in one line>** — <critical | serious | moderate | minor> · WCAG <criterion>
   - Heard: `<verbatim phrase>`
   - Cause: <element and attribute> (verified in the DOM) — or: unverified
   - Fix: <one line> (modern-web-guidance: `<id>`, when used)

**Not checked:** <checks from checks.md that were not run, and why>

**Deviations:** <anything done differently from the skill, and why — or "none">
```

## Rules

- A finding names its cause only after a DOM or accessibility-tree check. Otherwise mark it unverified.
- A usage hint ("You are currently on …", German "Du bist jetzt auf …") is never an item or a finding.
- Count a check with announcements as passed only at 3 of 3. Report fewer with the count.
- Mark a finding seen only in Chrome as "Chrome + VoiceOver" unless you confirmed it in Safari.
