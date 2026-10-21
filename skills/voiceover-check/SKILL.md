---
name: voiceover-check
description: Use when a web change must be checked with a real screen reader on macOS — a ticket or definition of done asks for a VoiceOver or screen reader test, or the change adds or alters live regions, toasts, dialogs, focus moves, or accessible names, and you must know what VoiceOver actually announces and in which reading order.
---

# VoiceOver Check

Drive the real macOS VoiceOver screen reader through its own AppleScript interface, record what it says, and compare that with what the user must hear. The accessibility tree shows what the browser exposes. Only a real screen reader shows what is spoken, in which order, and whether an announcement survives a focus move.

All commands use `scripts/vo.sh`. Call it through `bash` with its absolute path, because each agent shell call can start in another directory. Run it without arguments to print its usage. Write logs to a temporary directory, never into a repository.

**When not to use it:**

- Not on macOS: tell the user that a screen reader pass needs a person with VoiceOver or NVDA.
- In CI or in an unattended or scheduled run: VoiceOver takes over the machine and the user's keyboard.
- Instead of the cheap checks: run axe and a keyboard test first (for example with the `a11y-debugging` skill). Use VoiceOver for what those cannot show.

## Step 1 — Ask before you start

VoiceOver speaks aloud, takes over the keyboard, and reads whatever app is in front. Tell the user what you will check and how long it takes (about 1.5 s per item). Ask them not to type or switch apps until you report back. Wait for their OK.

If you cannot ask the user yourself, for example as a subagent, do not start VoiceOver. Hand the question back to your caller.

## Step 2 — Prepare the page, then start VoiceOver

1. **Choose the browser.** Use the visible browser that your browser automation controls, often Chrome, when you must set up a page state. Use Safari, VoiceOver's reference browser, when no setup is needed: `open -a Safari "<url>"`. A headless browser is invisible to VoiceOver. Use local or test URLs only.
2. **Set the page state** before VoiceOver runs: signed in, item in the bag, size selected. If the criterion needs an error, cause a real one when you can. If you simulate it (offline mode, a stubbed request), say so in the report.
3. **Focus the start element**, for example the main heading, with your browser automation (`element.focus()`). The VoiceOver cursor follows the keyboard focus. A walk from the top of the page usually ends inside the header.
4. **Bring the browser to the front** once, now. Run `bash scripts/vo.sh front` and use the printed name as `<app>` in every later command ("Safari", "Google Chrome", "Google Chrome Canary").
5. **Start VoiceOver:** `bash scripts/vo.sh start`. Give the call up to 3 minutes: on the first run, macOS can wait for the user to answer an Automation prompt. Then check the cursor position with `bash scripts/vo.sh last`.

If `start` reports that VoiceOver was already running, the session is the user's. Do not stop it at the end without their OK.

## Step 3 — Check the reading order and the names

Run `bash scripts/vo.sh walk "<app>" 40`. The script moves the VoiceOver cursor 40 items forward and prints one line per item. A line marked `(no move)` means the cursor stayed in place. To stop on a control, use `bash scripts/vo.sh seek "<app>" "<part of its name>"` instead.

If the cursor stops on a dialog or a group, run `bash scripts/vo.sh into "<app>"` once, then walk again. `out` goes back. Do not use `into` on a plain control: VoiceOver then interacts with the parts of the control, and the walk stays inside it.

Compare each line with the expected name, role, and state. Quote the spoken text verbatim in your report. VoiceOver speaks the roles in the macOS system language and reads the page text as it is. On a German system, "Taste" is a button, "Überschrift-Ebene 2" is a heading level 2, "reduziert" is collapsed, and "Einblendmenü" means a popup. Take the expected texts from the source, for example the translation files, not from the ticket.

## Step 4 — Check announcements

A live announcement replaces the last phrase, so a walk misses it. Use `act`, which listens first and then presses VO-Space, the way a screen reader user does:

1. Move to the control: `bash scripts/vo.sh seek "<app>" "Add to bag"`.
2. Run `bash scripts/vo.sh act "<app>" 10`. It prints a timestamped `[act]` line, then every new phrase for 10 s.
3. Check whether the text reached the live region in the DOM or in the accessibility tree too. Then a failure has a clear cause: never rendered, or rendered but not spoken.

Run each check 3 times. Before each run, reload the page and set the state again, so that an unchanged live region or a stale phrase cannot hide the next announcement. The check passes only at 3 of 3. Report fewer as a finding with the count, not as a flaky test.

VoiceOver often drops a polite announcement that arrives in the same moment as a focus move. It reads the newly focused element and skips the message. A common fix is to send the announcement about 1 s after the focus move.

To catch an announcement that another action causes, run `bash scripts/vo.sh poll 15` in the same shell call as that action.

## Step 5 — Stop VoiceOver and report

Run `bash scripts/vo.sh stop`, also after a failure or an interruption. The script confirms that VoiceOver is off. The only exception: VoiceOver was already running before Step 2.

Report per criterion: what the user must hear, what VoiceOver said (verbatim), pass or fail with the run count, the browser, and whether an error was real or simulated.

## Stop conditions

| Signal | Action |
| --- | --- |
| Exit code 2: another app is in front | Run `stop` and ask the user. Do not bring the browser back yourself, with `open`, `activate`, or a browser automation call. The user may be working in the other app. |
| macOS asks whether an app may control VoiceOver | Only the user answers this prompt. Wait. Do not run `stop`, because it sends the same request. |
| Any other system dialog (password, update, permission) | Do not touch it. Run `stop` and ask the user. |
| Exit code 3 from `start` | Follow the message. It names the setup step in [references/setup.md](references/setup.md) and says when the user must turn VoiceOver off with Cmd+F5. |
| Exit code 4: the cursor does not move | Check the last lines. VoiceOver says "end of content" in the system language at the end of the page (German: "Ende Inhalt"). Otherwise it is a focus trap, or a dialog: then run `into` once. |
| Exit code 5 from `seek` | The control was not spoken. Check its accessible name before you try again. |
| The screen locks | VoiceOver stops reading. Ask the user to unlock it. |

## Rules

- **Use `scripts/vo.sh`.** For a move it does not have, send VoiceOver's own AppleScript commands (`tell application "VoiceOver" to tell vo cursor to move left`), and only while VoiceOver runs. A command to an app that is off starts it.
- **Do not send keystrokes through System Events** (`key code`, `keystroke`). That needs the Accessibility permission, a system security setting, and the keys go to whatever app is in front.
- **Do not toggle VoiceOver with Cmd+F5.** The same key turns it off when it already runs.
- **Do not change system settings.** No Guidepup (`@guidepup/*`), no `defaults write com.apple.VoiceOver…`, no `tccutil`, no `sudo`, no Safari developer settings. If the agent's sandbox blocks `osascript`, `pgrep`, or `lsappinfo`, ask the user. Do not turn the sandbox off yourself.
- **Read only `content of last phrase`.** `text under cursor` fails with error -1728 on macOS 26.
- **Walk linearly.** The AppleScript interface has no reliable jump to the next heading or landmark.
