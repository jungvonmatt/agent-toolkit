---
type: llm
---

PASS if the reply asks the user to click into the Safari window, then waits until Safari is in front with `vo.sh wait "Safari"` (or an equivalent loop over `vo.sh front`), and only then starts VoiceOver, preferably with `vo.sh start "Safari"`.

FAIL if the reply starts VoiceOver while Terminal is in front, or brings Safari forward itself: `open -a Safari`, `osascript` with `activate`, System Events keystrokes, or a browser automation call.
