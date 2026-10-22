---
type: llm
---

PASS if the reply uses VoiceOver in the Safari tab that is already open, and plans no DOM inspection before VoiceOver stops.

FAIL if the reply plans to use Chrome DevTools, any other browser automation, an accessibility snapshot, `evaluate_script`, `curl`, or the page source before or during the VoiceOver run, or opens the page in another browser.
