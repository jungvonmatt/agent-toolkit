---
name: voiceover-check
description: Use when a web change must be checked with a real screen reader on macOS — a ticket or definition of done asks for a VoiceOver or screen reader test, or the change adds or alters live regions, toasts, dialogs, focus moves, or accessible names, and you must know what VoiceOver actually announces and in which reading order.
argument-hint: "[page URL] [mode: full | targeted] [scope: feature or flow]"
---

# VoiceOver Check

Drive the real macOS VoiceOver screen reader through its own AppleScript interface, record what it says, and compare that with what the user must hear. The accessibility tree shows what the browser exposes. Only a real screen reader shows what is spoken, in which order, and whether an announcement survives a focus move.

All commands use `scripts/vo.sh`. Call it through `bash` with its absolute path, because each agent shell call can start in another directory. Run it without arguments to print its usage. Write logs to a temporary directory, never into a repository.

**When not to use it:**

- In CI or in an unattended or scheduled run: VoiceOver takes over the machine and the user's keyboard.
- For color contrast, target size, zoom, reduced motion, or visible focus: these need no screen reader. Use the `a11y-debugging` or `accessibility` skill.

## Modes and handoff

**Full** checks the whole page. **Targeted** checks a named feature or user flow, including its entry, relevant states, local reading order, and exit or focus return. Both use the same evidence and safety rules. With no explicit mode, a named component selects targeted; otherwise use full. Targeted needs a scope: ask only if it cannot be established from the request. A manual targeted check needs no PR or Git diff.

Accept natural language or these fields as skill instructions, not shell flags:

```text
/jvm-skills:voiceover-check https://example.test
mode: targeted
scope: Main navigation including its submenus
browser: Chrome, existing tab
```

For a handoff from a review or implementation skill, read this packet before Step 1:

| Input | Use |
| --- | --- |
| URL, browser/tab, starting state | Honor the requested environment and existing state |
| Feature or flow, affected consumers | Select the smallest complete user flow, not just changed lines |
| Scenarios and expected behavior, with requirement source | Define what to verify independently of what the implementation happens to expose |
| Included interactions and excluded destinations | Keep owned submenus/dialogs in scope and unrelated features out |
| Prior knowledge and baseline evidence, if any | Label code-informed checks as guided; attribute a regression only with comparison evidence |

The caller derives scope from the diff and the changed component's consumers. Static code knowledge can identify risk, but cannot prove what VoiceOver announces. Declare prior code or browser inspection rather than calling the check blind. Obtain names and navigate through VoiceOver during the actual pass; DOM labels, selectors, and snapshots are not navigation instructions. A failure on the changed branch is not automatically introduced by that branch.

Plan one valid execution per distinct check and state in either mode; Step 6 defines when to repeat. Complete the agreed scope without a total time budget or elapsed-time cutoff. Command timeouts and bounded navigation still protect against tool failures and lost context. Record elapsed time for setup/navigation, checks, and verification when measured, but never use it as a pass criterion.

## Step 1 — Check the machine

Run `bash scripts/vo.sh check`. It starts nothing, so it needs no OK from the user. It reads whether this is a Mac with VoiceOver and whether AppleScript control of VoiceOver is on.

- **Exit code 6:** this is not macOS, or VoiceOver is missing. Tell the user that a person must do the screen reader check, with VoiceOver on a Mac or NVDA on Windows. Stop here.
- **Exit code 3:** AppleScript control is off. Tell the user to open VoiceOver Utility → General and turn on "Allow VoiceOver to be controlled with AppleScript", as in step 1 of [references/setup.md](references/setup.md). Do not change the setting yourself. Stop here.
- **Exit code 0:** go on. `start` runs the same check again.

## Step 2 — Prepare the page

Test the page the way a screen reader user meets it. Before and during the VoiceOver run, use no browser automation, accessibility snapshot, DOM query, or page source to discover test targets. In a guided handoff, the caller may already know the diff, but must defer browser inspection until Step 7. Find, name, and operate the component through VoiceOver only. The DOM is for cause analysis after VoiceOver is off.

1. **Choose the browser.** Use the browser the user names. Without a named browser, use Safari in its existing window and tab. When the user requests an existing page or says it is already open, use that page, including in Chromium. Otherwise, use a separate Chromium instance with a fresh profile in Step 4 (`launch`). A headless browser is invisible to VoiceOver. Never switch to another browser than the one the user names.
2. **Open the page** only when it is not open yet: `open -a "<app>" "<url>"`. Skip this command when planning to use `launch`, which opens the URL itself. When the user says it is open, do not open, reload, or navigate it.
3. **Fix the scope.** Apply the mode above. For a targeted check, include the feature's owned interactions, such as opening and closing navigation submenus, plus entry and focus return. A link to another page or a trigger for an unrelated feature gets its name, role, and state checked, not its destination tested. For shared components, cover materially different affected contexts identified in the handoff; record which consumers are represented and which remain untested. Ask before widening the agreed scope.
4. **Choose the checks.** Take the sections for the component from [references/checks.md](references/checks.md): page, images, controls, dialog, form, live region, menu, tabs, or data table. Take only the sections that fit the scope. Take the expectations from the user, the ticket, and the checks: role, state, a name that makes sense, and the reading order. Do not copy expected texts out of the DOM.
5. **Set the page state.** If a check needs a state (signed in, item in the bag, an error), ask the user to set it in the test window before the run. For a separate Chromium instance, explain the fresh profile and run `launch` before the handoff so they can prepare that instance. This starts no VoiceOver. Do not launch another instance afterward. Cause a real error when you can. If the user simulates it, say so in the report.

## Step 3 — Ask before you start

VoiceOver speaks aloud, takes over the keyboard, and reads whatever app is in front. Tell the user the mode, scope, browser, and planned scenarios. Explain that each distinct state is checked once by default and additional attempts need a reason. Give a duration estimate only when grounded in the planned steps; it is not a time limit.

Tell the user that you will bring the chosen browser forward after their OK. Ask them not to type or switch apps until you report back. Wait for their OK. They do not need to click the browser or reply from it.

If you cannot ask the user yourself, for example as a subagent, do not start VoiceOver. Hand the question back to your caller.

## Step 4 — Start VoiceOver

1. **Activate and start once, after the user's OK.** Use the app name as `front` prints it in every command. Choose one branch:
   - Existing browser, or an instance already launched for state setup: `bash scripts/vo.sh focus "<app>" && bash scripts/vo.sh start "<app>"`.
   - New Chromium instance: `bash scripts/vo.sh launch "<app>" "<url>" && bash scripts/vo.sh start "<app>"`. It uses a fresh profile without login or cookies and leaves the user's own browser open.
2. **Verify focus.** `launch` binds the test to its browser PID. Later `focus` activates that PID, and `wait`, `start`, and interactions reject another instance even with the same app name. Without `launch`, the check verifies only the app name, so confirm the page through VoiceOver too. Give `start` up to 3 minutes for a first-run Automation prompt. If activation fails, use the manual handoff in Stop conditions. Once the test starts, an app or instance switch stops it. Do not reclaim focus automatically.
3. **Enter the page through VoiceOver.** Run `bash scripts/vo.sh last`. If the cursor is already inside the requested page, continue. If it is in browser UI, use `bash scripts/vo.sh web "<app>" "<title spoken by VoiceOver>" 15` once. `web` does not switch tabs: the test page must be the active tab, so never walk through the tab strip to find it. If another tab is active, stop and ask the user to select the test tab. `web` searches a bounded number of top-level items and enters only a title followed by the spoken role `web content` or `Webinhalt`, not a tab with that title. If no title was spoken, use `do "<app>" "jump to top level"` and a short `walk` to identify it through VoiceOver. For other system languages, require a positively identified web-area role before `into`. If the page or role remains uncertain, stop and report a navigation blocker. Do not repeat focus/start to fix a cursor-context problem. Never take labels from a DOM inspection.
4. **Watch for hints.** A phrase like "You are currently on …" (German: "Du bist jetzt auf …") or "To click this button, press …" is a usage hint, not an item. `walk` and `seek` keep only the item. `act` and `poll` print hints as extra lines. Never report a hint as an item or an announcement. Suggest that the user turns hints off, as in step 3 of [references/setup.md](references/setup.md).

`start` remembers the VoiceOver it launched, also across a retry. `stop` quits only that one and leaves the user's own session on. Use `stop --force` only with the user's OK.

## Step 5 — Check the reading order and the names

**Choose navigation for the question.** Discover the commands this Mac provides once per session with `bash scripts/vo.sh commands "find next"`. Use only names returned by that list. From inside the web area, `do "<app>" "find next heading"` or `do "<app>" "find next landmark"` can locate the target or establish page structure. Filter `commands` for `button`, `control`, `link`, `text field`, or `find previous` when those fit the task. Reuse known commands instead of rediscovering them for every check. These jumps do not prove the sequential reading order.

**Act as an experienced VoiceOver user.** Whatever the task, move the way a fluent daily VoiceOver user would: skim the structure with jumps, read linearly only where the order or the content matters, and leave an area as soon as its task is done. Each linear step costs a VoiceOver round trip, so walking through content the task does not need is slow and proves nothing extra.

1. **Plan the route.** Before the first move, break the task into goals in user order, for example "reach the form, fill two fields, choose an option, submit". For each goal, pick the jump that matches the target's role and the bound you expect.
2. **Take the route.** From the current position, use the shortest move to the next goal, forward or backward. Do not return to the page start between goals.
3. **Read locally.** At each goal, walk only the items needed to verify it: label, role, state, and the local order.
4. **Treat a missed jump as evidence.** If an expected jump misses its target, try one alternative and continue. An expert user relies on the same structure, so a missing heading, landmark, group, or name is a possible finding, not just a navigation problem.

| Situation | Do | Do not |
| --- | --- | --- |
| Target is a heading, landmark, form control, field, button, or link | `jump "<app>" "find next heading" "<spoken name>" 6`, or the matching `control`, `text field`, `button`, `radio group`, `landmark` command | `seek` item by item from the top |
| A group of options, such as radio buttons, swatches, chips, or filters | Read the group label and the first option with its position, for example "1 of 15". `seek` to the option you need, `act`, then leave with `do "<app>" "find next different item"`, `find next radio group`, `find next heading`, or `out` and one move | Walk every option to the end of the group, then walk back |
| Several groups or sections in a row | After finishing one, jump to the next group label or first control | Return through the finished group with `back` |
| You passed the target or need an earlier element | `jump` with the matching `find previous …` command, or `seekback` with a small bound | Walk forward to the end, or restart from the top of the page |
| Cursor is in browser UI or the wrong place | `last`, then `web` once (Step 4) | Walk through tabs or toolbar items one by one |
| A row of repeated items with the same pattern | Check the first, the one you use, and the last, and record the count VoiceOver announces | Read every item, unless the task is a full reading-order check of that list |

Use `do "<app>" "<command>" <times>` when you know how many jumps you need, for example `do "Safari" "find next control" 3`. A `jump` or `seek` that runs out of its bound means: reassess where the cursor is, not that the target is missing.

**Check order with a walk.** Run `bash scripts/vo.sh walk "<app>" 15` for a short page segment. For a whole-page check, cover the page through "end of content" (German: "Ende Inhalt"). For a component, use small batches and stop at its boundary. Use `seek "<app>" "<spoken name>" <max>` to find a control already heard nearby, and `back` or `seekback` to return. `seek` moves before matching, so use `act` directly when already on the target. Keep searches bounded to the chosen scope. Do not write your own loops over `osascript` or `front`.

In targeted mode, choose a structural jump before any linear search. Use an explicit small search bound, for example `seek "<app>" "<spoken name>" 12`, adjusted to the feature. Reaching it means reassess the cursor context with one suitable alternative, not that the feature failed. Once inside, walk the relevant local sequence and complete the feature's states without returning to the page start for every check.

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

1. Move to the control using its spoken name, for example `bash scripts/vo.sh jump "<app>" "find next button" "Add to bag" 5`, or use `act` directly when already on it.
2. Run `bash scripts/vo.sh act "<app>" 10`. It prints a timestamped `[act]` line, then every new phrase for 10 s. Run each `act` in its own shell call. Count only the lines after that call's own `[act]` line, never lines from an earlier log.
3. When nothing is spoken, note it. Step 7 checks whether the text reached the live region in the DOM: never rendered, or rendered but not spoken.

**One valid run per distinct scenario is the default**, in both modes. Initial labels, invalid submission, successful submission, and a repeated-identical-message scenario are separate checks when applicable, not reasons to repeat the whole feature. Count a run only when the intended action occurred in the confirmed context, the required state was set, and recording completed. A successful 1/1 proves only that observation, not ongoing reliability.

Repeat only the affected step when investigating a missing or contradictory announcement, recovering from an invalid attempt, or meeting an explicit repeatability requirement. Record the reason and count. For an unclear result, try one controlled follow-up; if still uncertain, report the blocker instead of looping. A known intermittent bug or an explicit reliability requirement needs an agreed repetition count. A valid observed failure remains a finding even when a later attempt succeeds. Focus loss, rejected commands, uncertain activation, and interrupted recording are blocked attempts, not page failures. Missing planned valid runs without an observed failure mean **incomplete**. Report completed/planned, successful, failed, and blocked counts.

Reset state only when the next scenario or a justified repeat needs it, so an old phrase cannot pass as a new one:

- **Live region, toast, or status message:** use the feature's normal VoiceOver-operated dismissal or reset when it restores the required state. If a fresh document is required or the state cannot be restored reliably, run `stop`, ask the user to reload and set the state, then run `focus` and `start` again. A region that keeps its text can stay silent. Do not reload by switching apps or sending keys, and do not reload between every check by default.
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
| Exit code 5 from `seek`, `seekback`, `jump`, or `web` | The bounded search found no confirmed target. Check the spoken name and role within scope. A failed search alone is not a page failure. If context remains uncertain, stop and report incomplete. |
| Exit code 6 | This is not macOS, or VoiceOver is missing. Tell the user that a person must do the screen reader check. |
| Exit code 7 from `commands`, `do`, or `jump` | The command is unavailable or the local command map cannot be read. Use supported cursor navigation or report a tooling blocker, not a page defect. |
| The log shows usage hints | Not a finding. Read past them, and suggest turning hints off (setup step 3). |
| The screen locks | VoiceOver stops reading. Ask the user to unlock it. |

## Rules

- **Use `scripts/vo.sh`.** Discover command names with `commands`, then use `do` for navigation, orientation, and in-scope interaction such as `escape`. A listed command is not permission to run it: do not use settings, application-switching, or unrelated commands. Do not bypass focus guards with raw AppleScript.
- **Do not send keystrokes through System Events** (`key code`, `keystroke`). That needs the Accessibility permission, a system security setting, and the keys go to whatever app is in front.
- **Do not toggle VoiceOver with Cmd+F5.** The same key turns it off when it already runs.
- **Do not change system settings.** No Guidepup (`@guidepup/*`), no `defaults write com.apple.VoiceOver…`, no `tccutil`, no `sudo`, no Safari developer settings. If the agent's sandbox blocks `osascript` or `pgrep`, ask the user. Do not turn the sandbox off yourself.
- **Read only `content of last phrase`.** `text under cursor` fails with error -1728 on macOS 26.
- **Use local command names, not guessed shortcuts.** Apple's [VoiceOver guide](https://support.apple.com/guide/voiceover/welcome/mac) and [command charts](https://help.apple.com/voiceover/command-charts/) explain navigation. The helper discovers accepted English command names from this Mac's private system map, which can change between macOS versions. Discover first, verify the spoken result, and keep a bounded cursor-navigation fallback.
