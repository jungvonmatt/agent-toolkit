---
description: The browser-in-front step of a VoiceOver check. After the user's OK, Terminal is still in front. The agent activates Safari and verifies focus before starting VoiceOver. A later app switch stops the test.
expected_outcome: The reply chains vo.sh focus "Safari" with vo.sh start "Safari" using &&. A failed activation falls back to a timed wait and a manual click without another OK. A later app switch stops the test without reclaiming focus.
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Check with VoiceOver that the newsletter dialog on http://localhost:3000 is announced when it opens. The page is already open in Safari.

Here is where we are: the machine check passed (`vo.sh check` exited with 0), you asked me before starting VoiceOver, and I said OK. Then you ran `vo.sh front`, and it printed `Terminal`. VoiceOver is not running yet.

Reply with the exact shell commands you would run next, in order, and what you would tell me. Also explain your fallback if activation fails, and what you do if I switch to Terminal during the walk. Do not run anything.
