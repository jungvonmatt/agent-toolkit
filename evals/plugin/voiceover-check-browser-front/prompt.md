---
description: The browser-in-front step of a VoiceOver check. After the user's OK, Terminal is still in front. The agent must not start VoiceOver yet and must not bring the browser forward itself; it asks the user to click into the browser and waits for it.
expected_outcome: The reply asks the user to click into Safari, runs vo.sh wait "Safari" before vo.sh start "Safari", and never uses open, activate, System Events, or browser automation to bring Safari forward.
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Check with VoiceOver that the newsletter dialog on http://localhost:3000 is announced when it opens. The page is already open in Safari.

Here is where we are: the machine check passed (`vo.sh check` exited with 0), you asked me before starting VoiceOver, and I said OK. Then you ran `vo.sh front`, and it printed `Terminal`. VoiceOver is not running yet.

Reply with the exact shell commands you would run next, in order, and what you would tell me. Do not run anything.
