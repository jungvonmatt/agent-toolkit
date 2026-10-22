---
type: llm
---

PASS if the reply runs `vo.sh focus "Safari" && vo.sh start "Safari"` (absolute paths and shell variables are accepted). The user's OK is already given. If activation fails, the agent asks for a click during `vo.sh wait "Safari"`, without another chat reply, and starts only when the wait succeeds. If the user switches apps during the walk, the agent stops VoiceOver and asks the user before resuming, without reclaiming focus automatically.

FAIL if the reply starts VoiceOver without verified browser focus, requires the user to click Safari and then return to chat to reply OK, uses System Events keystrokes, switches browsers, or automatically reactivates Safari after an app switch during the walk.
