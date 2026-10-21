---
name: voiceover-check
description: Use when a web change must be checked with a real screen reader on macOS — a ticket or definition of done asks for a VoiceOver or screen reader test, or the change adds or alters live regions, toasts, dialogs, focus moves, or accessible names, and you must know what VoiceOver actually announces and in which reading order.
argument-hint: "[page URL and what must be announced]"
---

# VoiceOver Check

Drive the real macOS VoiceOver screen reader through its own AppleScript interface, record what it says, and compare that with what the user must hear. The accessibility tree shows what the browser exposes. Only a real screen reader shows what is spoken, in which order, and whether an announcement survives a focus move.

All commands use `scripts/vo.sh`. Call it through `bash` with its absolute path, because each agent shell call can start in another directory. Run it without arguments to print its usage. Write logs to a temporary directory, never into a repository.

**When not to use it:**

- In CI or in an unattended or scheduled run: VoiceOver takes over the machine and the user's keyboard.
- For color contrast, target size, zoom, reduced motion, or visible focus: these need no screen reader. Use the `a11y-debugging` or `accessibility` skill.

## Step 1 — Check the machine

Run `bash scripts/vo.sh check`. It starts nothing, so it needs no OK from the user. It reads whether this is a Mac with VoiceOver and whether AppleScript control of VoiceOver is on.

- **Exit code 6:** this is not macOS, or VoiceOver is missing. Tell the user that a person must do the screen reader check, with VoiceOver on a Mac or NVDA on Windows. Stop here.
- **Exit code 3:** AppleScript control is off. Tell the user to open VoiceOver Utility → General and turn on "Allow VoiceOver to be controlled with AppleScript", as in step 1 of [references/setup.md](references/setup.md). Do not change the setting yourself. Stop here.
- **Exit code 0:** go on. `start` runs the same check again.

## Step 2 — Check in the browser and prepare the page

Do this with the browser automation you control, for example Chrome DevTools MCP, before VoiceOver runs. It is cheap, it gives you the expected texts, and it gives you the evidence for each finding later. Without browser automation, read the source or the served HTML instead, and mark findings whose cause you cannot see there as unverified.

1. **Find the target.** Open the URL in the automated browser and find the component in an accessibility snapshot (`take_snapshot`). If it opens from a control, such as a dialog behind a button, note that control's name. Do not search the page source by hand when a snapshot can show it.
2. **Run the cheap checks.** List the browser's own issues (`list_console_messages` with types `["issue"]`). They show missing labels and invalid ARIA without VoiceOver. For a full audit, use the `a11y-debugging` skill.
3. **Choose the checks.** Take the sections for the component from [references/checks.md](references/checks.md): page, controls, dialog, form, live region, or menu. Write down the expected name, role, and state for each check. Take the texts from the snapshot and the source, for example the translation files, not from the ticket. Take headings and landmarks from the snapshot: the VoiceOver walk cannot jump to them.
4. **Choose the browser for VoiceOver.** Safari is VoiceOver's reference browser. Use it when the state needs no setup: `open -a Safari "<url>"`. A dialog or menu can also be opened through VoiceOver itself in Step 4, with `seek` and `act`, the way a user does. Use the visible automated browser, often Chrome, when the state needs setup (signed in, item in the bag) or the check needs a reload between runs (Step 6). A headless browser is invisible to VoiceOver. Use local or test URLs only.
5. **Set the page state** before VoiceOver runs. If a check needs an error, cause a real one when you can. If you simulate it (offline mode, a stubbed request), say so in the report.
6. **Focus the start element**, for example the main heading, with your browser automation (`element.focus()`). The VoiceOver cursor follows the keyboard focus. A walk from the top of the page usually ends inside the header. In Safari without automation, the user's click in Step 3 sets the start.

## Step 3 — Ask before you start

VoiceOver speaks aloud, takes over the keyboard, and reads whatever app is in front. Tell the user what you will check, in which browser, and how long it takes: about 1.5 s per item, and 3 runs per announcement.

Ask the user to do two things after their OK:

1. Click into the browser window. In Safari, click the start element.
2. Not type or switch apps until you report back.

macOS often keeps the terminal in front when an agent tries to bring the browser forward, so the user's click is the reliable way. Wait for their OK.

If you cannot ask the user yourself, for example as a subagent, do not start VoiceOver. Hand the question back to your caller.

## Step 4 — Start VoiceOver

1. **Wait for the browser:** `bash scripts/vo.sh wait "<app>" 30`. Use the app name as `front` prints it ("Safari", "Google Chrome", "Google Chrome Canary") in every later command. `wait` and `front` only read which app is in front. They do not change it. Do not bring the browser forward yourself with `open`, `activate`, or a browser automation call.
2. **Start:** `bash scripts/vo.sh start "<app>"`. Give the call up to 3 minutes: on the first run, macOS can wait for the user to answer an Automation prompt. With `<app>`, `start` refuses to start while another app is in front, and checks again after the start. You can join both in one shell call: `bash scripts/vo.sh wait "<app>" 30 && bash scripts/vo.sh start "<app>"`.
3. **Check the cursor:** `bash scripts/vo.sh last`. If the component opens from a control, `seek` that control and `act` on it (Step 6).
4. **Watch for hints.** A phrase like "You are currently on …" (German: "Du bist jetzt auf …") or "To click this button, press …" is a usage hint, not an item. `walk` and `seek` keep only the item. `act` and `poll` print hints as extra lines. Never report a hint as an item or an announcement. Suggest that the user turns hints off, as in step 3 of [references/setup.md](references/setup.md).

`start` remembers the VoiceOver it launched, also across a retry. `stop` quits only that one and leaves the user's own session on. Use `stop --force` only with the user's OK.

## Step 5 — Check the reading order and the names

Run `bash scripts/vo.sh walk "<app>" 40`. The script moves the VoiceOver cursor 40 items forward and prints one line per item. To stop on a control, use `bash scripts/vo.sh seek "<app>" "<part of its name>"` instead.

| Marker | Meaning |
| --- | --- |
| `(no move)` | The cursor stayed in place |
| `(same text)` | The cursor moved to an item with the same text as the one before |
| `(empty phrase)` | VoiceOver spoke nothing for this item. Check the DOM in Step 7 |

If the cursor stops on a dialog or a group, run `bash scripts/vo.sh into "<app>"` once, then walk again. `out` goes back. Do not use `into` on a plain control: VoiceOver then interacts with the parts of the control, and the walk stays inside it.

Compare each line with the expected text from Step 2. Quote the spoken text verbatim in your report. VoiceOver speaks the roles in the macOS system language and reads the page text as it is. On a German system, "Taste" is a button, "Überschrift-Ebene 2" is a heading level 2, "reduziert" is collapsed, and "Einblendmenü" means a popup.

## Step 6 — Check announcements

A live announcement replaces the last phrase, so a walk misses it. Use `act`, which listens first and then presses VO-Space, the way a screen reader user does:

1. Move to the control: `bash scripts/vo.sh seek "<app>" "Add to bag"`.
2. Run `bash scripts/vo.sh act "<app>" 10`. It prints a timestamped `[act]` line, then every new phrase for 10 s. Run each `act` in its own shell call. Count only the lines after that call's own `[act]` line, never lines from an earlier log.
3. Check whether the text reached the live region in the DOM or in the accessibility tree too. Then a failure has a clear cause: never rendered, or rendered but not spoken.

Run each check 3 times. The check passes only at 3 of 3. Report fewer as a finding with the count, not as a flaky test. Reset between runs, so that an old phrase cannot pass as the new one:

- **Live region, toast, or status message:** reload the page and set the state again before each run. A region that keeps its text can stay silent. Use the automated browser for these checks, because it can reload while VoiceOver runs. Do not reload Safari by switching apps or sending keys.
- **Focus move**, for example to the first invalid field after a submit: no reload is needed. `seek` back to the control and `act` again. The focus move makes VoiceOver speak again.

VoiceOver often drops a polite announcement that arrives in the same moment as a focus move. It reads the newly focused element and skips the message. A common fix is to send the announcement about 1 s after the focus move.

To catch an announcement that another action causes, run `bash scripts/vo.sh poll "<app>" 15` in the same shell call as that action.

## Step 7 — Stop VoiceOver, verify, and report

1. **Stop:** run `bash scripts/vo.sh stop`, also after a failure or an interruption. The script confirms that VoiceOver is off, or that it left the user's own session on.
2. **Verify each finding** with the automated browser: snapshot or `evaluate_script`. Name the cause: the element and its attribute, for example `aria-invalid="true"` on load, a dialog without `aria-modal`, or an empty error container. After a Safari run, open the same URL in the automated browser now. If you cannot confirm the cause, mark the finding unverified. Do not present a guess as the cause.
3. **Confirm the browser.** A finding seen only with Chrome is reported as "Chrome + VoiceOver". When it is about what is spoken, not about the DOM, check it in Safari when you can.
4. **Rate each finding** with a severity and a WCAG criterion from [references/checks.md](references/checks.md). When the `modern-web-guidance` skill is present, search it for the fix and name the guide.
5. **Report** with [references/report-template.md](references/report-template.md): per check, what the user must hear, what VoiceOver said (verbatim), pass or fail with the run count, the browser, and whether an error was real or simulated. List the checks you did not run, and any deviation from this skill.

## Stop conditions

| Signal | Action |
| --- | --- |
| Exit code 2 from `wait` or `start`: the browser is not in front | Ask the user to click into the browser. Then run `wait` and `start` again. If `start` already started VoiceOver, run `stop` first. |
| Exit code 2 from any other command: another app is in front | Run `stop` and ask the user. Do not bring the browser back yourself, with `open`, `activate`, or a browser automation call. The user may be working in the other app. |
| macOS asks whether an app may control VoiceOver | Only the user answers this prompt. Wait. Do not run `stop`, because it sends the same request. |
| Any other system dialog (password, update, permission) | Do not touch it. Run `stop` and ask the user. |
| Exit code 3 from `start` | Follow the message. It names the setup step in [references/setup.md](references/setup.md) and says when the user must turn VoiceOver off with Cmd+F5. |
| Exit code 3 from another command | VoiceOver rejected an AppleScript command. Run `stop` and report it. Do not report it as a defect of the page. |
| Exit code 4: the cursor does not move | Check the last lines. VoiceOver says "end of content" in the system language at the end of the page (German: "Ende Inhalt"). Otherwise it is a focus trap, or a dialog: then run `into` once. |
| Exit code 5 from `seek` | The control was not spoken. Check its accessible name in the snapshot before you try again. |
| Exit code 6 | This is not macOS, or VoiceOver is missing. Tell the user that a person must do the screen reader check. |
| The log shows usage hints | Not a finding. Read past them, and suggest turning hints off (setup step 3). |
| The screen locks | VoiceOver stops reading. Ask the user to unlock it. |

## Rules

- **Use `scripts/vo.sh`.** For a move it does not have, send VoiceOver's own AppleScript commands (`tell application "VoiceOver" to tell vo cursor to move left`), and only while VoiceOver runs. A command to an app that is off starts it.
- **Do not send keystrokes through System Events** (`key code`, `keystroke`). That needs the Accessibility permission, a system security setting, and the keys go to whatever app is in front.
- **Do not toggle VoiceOver with Cmd+F5.** The same key turns it off when it already runs.
- **Do not change system settings.** No Guidepup (`@guidepup/*`), no `defaults write com.apple.VoiceOver…`, no `tccutil`, no `sudo`, no Safari developer settings. If the agent's sandbox blocks `osascript`, `pgrep`, or `lsappinfo`, ask the user. Do not turn the sandbox off yourself.
- **Read only `content of last phrase`.** `text under cursor` fails with error -1728 on macOS 26.
- **Walk linearly.** The AppleScript interface has no reliable jump to the next heading or landmark. Take headings and landmarks from the snapshot in Step 2.
