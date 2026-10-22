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

## Step 2 — Prepare the page

Test the page the way a screen reader user meets it. Before and during the VoiceOver run, use no browser automation, accessibility snapshot, DOM query, or page source. Find, name, and operate the component through VoiceOver only. The DOM is for the cause analysis in Step 7.

1. **Choose the browser.** Use the browser the user names. Without a named browser, use Safari in its existing window and tab. When the user requests an existing page or says it is already open, use that page, including in Chromium. Otherwise, use a separate Chromium instance with a fresh profile in Step 4 (`launch`). A headless browser is invisible to VoiceOver. Never switch to another browser than the one the user names.
2. **Open the page** only when it is not open yet: `open -a "<app>" "<url>"`. Skip this command when planning to use `launch`, which opens the URL itself. When the user says it is open, do not open, reload, or navigate it.
3. **Fix the scope.** When the user names no component, test the whole page, and do not ask for a component. When the user names one, test only that component. A control in it that opens something else, such as a button that opens a dialog, gets its name, role, and state checked. Do not open the target and test it. If you think a wider check is needed, ask before the run.
4. **Choose the checks.** Take the sections for the component from [references/checks.md](references/checks.md): page, controls, dialog, form, live region, or menu. Take only the sections that fit the scope. Take the expectations from the user, the ticket, and the checks: role, state, a name that makes sense, and the reading order. Do not copy expected texts out of the DOM.
5. **Set the page state.** If a check needs a state (signed in, item in the bag, an error), ask the user to set it in the test window before the run. For a separate Chromium instance, explain the fresh profile and run `launch` before the handoff so they can prepare that instance. This starts no VoiceOver. Do not launch another instance afterward. Cause a real error when you can. If the user simulates it, say so in the report.

## Step 3 — Ask before you start

VoiceOver speaks aloud, takes over the keyboard, and reads whatever app is in front. Tell the user what you will check, in which browser, and how long it takes: about 1.5 s per item, and 3 runs per announcement.

Tell the user that you will bring the chosen browser forward after their OK. Ask them not to type or switch apps until you report back. Wait for their OK. They do not need to click the browser or reply from it.

If you cannot ask the user yourself, for example as a subagent, do not start VoiceOver. Hand the question back to your caller.

## Step 4 — Start VoiceOver

1. **Activate and start once, after the user's OK.** Use the app name as `front` prints it in every command. Choose one branch:
   - Existing browser, or an instance already launched for state setup: `bash scripts/vo.sh focus "<app>" && bash scripts/vo.sh start "<app>"`.
   - New Chromium instance: `bash scripts/vo.sh launch "<app>" "<url>" && bash scripts/vo.sh start "<app>"`. It uses a fresh profile without login or cookies and leaves the user's own browser open.
2. **Verify focus.** `launch` binds the test to its browser PID. Later `focus` activates that PID, and `wait`, `start`, and interactions reject another instance even with the same app name. Without `launch`, the check verifies only the app name, so confirm the page through VoiceOver too. Give `start` up to 3 minutes for a first-run Automation prompt. If activation fails, use the manual handoff in Stop conditions. Once the test starts, an app or instance switch stops it. Do not reclaim focus automatically.
3. **Enter the page through VoiceOver.** Run `bash scripts/vo.sh last`. If the cursor is already inside the requested page, continue. If it is in browser UI, use `bash scripts/vo.sh web "<app>" "<title spoken by VoiceOver>" 15`. This searches a bounded number of top-level items and enters only a title followed by the spoken role `web content` or `Webinhalt`, not a tab with that title. If no title was spoken, use `do "<app>" "jump to top level"` and a short `walk` to identify it through VoiceOver. For other system languages, require a positively identified web-area role before `into`. If the page or role remains uncertain, stop and report a navigation blocker. Do not repeat focus/start to fix a cursor-context problem. Never take labels from a DOM inspection.
4. **Watch for hints.** A phrase like "You are currently on …" (German: "Du bist jetzt auf …") or "To click this button, press …" is a usage hint, not an item. `walk` and `seek` keep only the item. `act` and `poll` print hints as extra lines. Never report a hint as an item or an announcement. Suggest that the user turns hints off, as in step 3 of [references/setup.md](references/setup.md).

`start` remembers the VoiceOver it launched, also across a retry. `stop` quits only that one and leaves the user's own session on. Use `stop --force` only with the user's OK.

## Step 5 — Check the reading order and the names

**Choose navigation for the question.** First discover the commands this Mac provides with `bash scripts/vo.sh commands "find next"`. Use only names returned by that list. From inside the web area, `do "<app>" "find next heading"` or `do "<app>" "find next landmark"` can establish the page structure. Filter `commands` for `button`, `control`, `link`, `text field`, or `find previous` when those fit the task. These jumps find structure and controls; they do not prove the sequential reading order.

**Check order with a walk.** Run `bash scripts/vo.sh walk "<app>" 15` for a short page segment. For a whole-page check, cover the page through "end of content" (German: "Ende Inhalt"). For a component, use small batches and stop at its boundary. Use `seek "<app>" "<spoken name>" <max>` to find a control already heard, and `back` or `seekback` to return. `seek` moves before matching, so use `act` directly when already on the target. Keep searches bounded to the chosen scope. Do not write your own loops over `osascript` or `front`.

**Investigate before declaring missing content.** If content does not follow its trigger, first confirm activation and the announced expanded state or focus change. Check whether VoiceOver must interact with an announced group or dialog. Then try one suitable navigation method within the component. A different reading position is not proof of inaccessible content. Record a confusing order when observed, but mark reachability unverified if the cursor context or activation remains uncertain. Do not search or test unrelated page content to force an answer.

| Marker | Meaning |
| --- | --- |
| `(no move)` | The cursor stayed in place |
| `(same text)` | The cursor moved to an item with the same text as the one before |
| `(empty phrase)` | VoiceOver spoke nothing for this item. Check the DOM in Step 7 |

If the cursor stops on a dialog or a group, run `bash scripts/vo.sh into "<app>"` once, then walk again. `out` goes back. Do not use `into` on a plain control: VoiceOver then interacts with the parts of the control, and the walk stays inside it.

Compare each line with the expectations from Step 2. Quote the spoken text verbatim in your report. VoiceOver speaks the roles in the macOS system language and reads the page text as it is. On a German system, "Taste" is a button, "Überschrift-Ebene 2" is a heading level 2, "reduziert" is collapsed, and "Einblendmenü" means a popup.

## Step 6 — Check announcements

A live announcement replaces the last phrase, so a walk misses it. Use `act`, which listens first and then presses VO-Space, the way a screen reader user does:

1. Move to the control: `bash scripts/vo.sh seek "<app>" "Add to bag"`.
2. Run `bash scripts/vo.sh act "<app>" 10`. It prints a timestamped `[act]` line, then every new phrase for 10 s. Run each `act` in its own shell call. Count only the lines after that call's own `[act]` line, never lines from an earlier log.
3. When nothing is spoken, note it. Step 7 checks whether the text reached the live region in the DOM: never rendered, or rendered but not spoken.

Plan 3 runs for each announcement check. Count only valid runs: the intended action occurred in the confirmed context, the required state was set, and recording completed. Pass requires 3 successful valid runs. An observed expectation failure in a valid run is a finding, even if later runs pass. A focus loss, rejected command, uncertain activation, or interrupted recording is a blocked attempt, not a page failure. If fewer than 3 valid runs completed and none failed, report **incomplete**, with the blocker. Always give completed/planned, successful, failed, and blocked counts. Reset between runs, so that an old phrase cannot pass as the new one:

- **Live region, toast, or status message:** reload the page and set the state again before each run. A region that keeps its text can stay silent. Run `stop`, ask the user to reload and set the state, then run `focus` and `start` again. Do not reload the browser yourself by switching apps or sending keys.
- **Focus move**, for example to the first invalid field after a submit: no reload is needed. `seek` back to the control and `act` again. The focus move makes VoiceOver speak again.

The script samples changes to the last phrase, not the audio stream. Identical repeated phrases and rapid changes may be missed. If that limitation prevents a conclusion, report incomplete and request a listening check. A polite announcement can compete with a focus move; verify the cause before recommending a timing change.

To catch an announcement that another action causes, run `bash scripts/vo.sh poll "<app>" 15` in the same shell call as that action.

## Step 7 — Stop VoiceOver, verify, and report

1. **Stop:** run `bash scripts/vo.sh stop`, also after a failure or an interruption. Keep the browser and its state open for verification. If the script leaves the user's own VoiceOver session on, ask before stopping it. Without permission, skip browser inspection and record that limitation.
2. **Verify each finding** only after VoiceOver is off. Use a snapshot or `evaluate_script` in the same test instance, tab, and state when available. The same URL in another browser is not the same state. If automation cannot attach to that instance, use the served HTML or source as supporting evidence, not proof of the runtime state. Mark the **cause** unverified when it cannot be confirmed. Keep an observed VoiceOver failure separate from its suspected cause.
3. **Confirm the browser.** Label findings seen only in Chrome as "Chrome + VoiceOver". A Safari cross-check needs the user's agreement when it changes the requested browser or scope.
4. **Rate each finding** with a severity and a WCAG criterion from [references/checks.md](references/checks.md). When the `modern-web-guidance` skill is present, search it for the fix and name the guide.
5. **Clean up after evidence collection:** if you ran `launch`, run `bash scripts/vo.sh close` now. It quits only that instance and deletes its profile. Also close it when a run is abandoned after stopping VoiceOver; do not leave a test instance behind silently. If stopping or closing fails, report what remains running and follow the recovery message.
6. **Report** with [references/report-template.md](references/report-template.md): expected and spoken text, pass/fail/incomplete, valid and blocked run counts, browser, and real or simulated errors. List checks not run and deviations. Do not call the whole scope passed while required checks are incomplete.

## Stop conditions

| Signal | Action |
| --- | --- |
| Exit code 2 from `launch`, `focus`, `wait`, or `start`: the browser is not in front | If VoiceOver was started by this test, run `stop` first. Tell the user you will start a 30-second wait, then ask them to click into the browser during that wait without replying again. Run `bash scripts/vo.sh wait "<app>" 30 && bash scripts/vo.sh start "<app>"`. If it times out, report the blocker. Do not repeat the OK-and-click loop. |
| Exit code 2 from any other command: another app or browser instance is in front | Run `stop` and ask the user. Do not bring the browser back yourself, with `open`, `activate`, or a browser automation call. The user may be working in the other app. The interrupted attempt is incomplete. |
| macOS asks whether an app may control VoiceOver | Only the user answers this prompt. Wait. Do not run `stop`, because it sends the same request. |
| Any other system dialog (password, update, permission) | Do not touch it. Run `stop` and ask the user. |
| Exit code 3 from `start` | Follow the message. It names the setup step in [references/setup.md](references/setup.md) and says when the user must turn VoiceOver off with Cmd+F5. |
| Exit code 3 from another command | VoiceOver rejected an AppleScript command. Run `stop` and report it. Do not report it as a defect of the page. |
| Exit code 4, or `(no move)` after `do` | Check the last lines and cursor context. It may be the end, an unavailable target, or a group requiring interaction. Use `into` only for an announced group or dialog. Try one context-appropriate alternative, then report a blocker if uncertain. This alone does not prove a focus trap. |
| Exit code 5 from `seek`, `seekback`, or `web` | The bounded search found no confirmed target. Check the spoken name and role within scope. A failed search alone is not a page failure. If context remains uncertain, stop and report incomplete. |
| Exit code 6 | This is not macOS, or VoiceOver is missing. Tell the user that a person must do the screen reader check. |
| Exit code 7 from `commands` or `do` | The command is unavailable or the local command map cannot be read. Use supported cursor navigation or report a tooling blocker, not a page defect. |
| The log shows usage hints | Not a finding. Read past them, and suggest turning hints off (setup step 3). |
| The screen locks | VoiceOver stops reading. Ask the user to unlock it. |

## Rules

- **Use `scripts/vo.sh`.** Discover command names with `commands`, then use `do` for navigation, orientation, and in-scope interaction such as `escape`. A listed command is not permission to run it: do not use settings, application-switching, or unrelated commands. Do not bypass focus guards with raw AppleScript.
- **Do not send keystrokes through System Events** (`key code`, `keystroke`). That needs the Accessibility permission, a system security setting, and the keys go to whatever app is in front.
- **Do not toggle VoiceOver with Cmd+F5.** The same key turns it off when it already runs.
- **Do not change system settings.** No Guidepup (`@guidepup/*`), no `defaults write com.apple.VoiceOver…`, no `tccutil`, no `sudo`, no Safari developer settings. If the agent's sandbox blocks `osascript`, `pgrep`, or `lsappinfo`, ask the user. Do not turn the sandbox off yourself.
- **Read only `content of last phrase`.** `text under cursor` fails with error -1728 on macOS 26.
- **Use local command names, not guessed shortcuts.** Apple's [VoiceOver guide](https://support.apple.com/guide/voiceover/welcome/mac) and [command charts](https://help.apple.com/voiceover/command-charts/) explain navigation. The helper discovers accepted English command names from this Mac's private system map, which can change between macOS versions. Discover first, verify the spoken result, and keep a bounded cursor-navigation fallback.
