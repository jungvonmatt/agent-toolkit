# VoiceOver Check — One-Time Setup

A person does this setup once per Mac. The agent never makes these settings, because they control what may drive the screen reader.

## 1. Allow AppleScript control

1. Open VoiceOver Utility: System Settings → Accessibility → VoiceOver → **Open VoiceOver Utility…**. You can also run `open -a "VoiceOver Utility"`.
2. In **General**, turn on **Allow VoiceOver to be controlled with AppleScript**.

Without this setting, `vo.sh start` stops with exit code 3.

## 2. Start VoiceOver once by hand

Press Cmd+F5 and close the welcome dialog. Turn off the dialog for later starts if macOS offers it. Press Cmd+F5 again to stop VoiceOver.

The agent must not click dialogs, so the welcome dialog would block its first run.

## 3. Turn off hints (recommended)

VoiceOver speaks a usage hint after a short pause, for example how to activate a button. The hint can replace the item text in the log. Turn the hints off in VoiceOver Utility → **Verbosity** → **Hints**.

Keep the default in VoiceOver Utility → **Navigation**: the VoiceOver cursor follows the keyboard focus. The agent places the cursor by moving the focus in the page.

## 4. Allow Automation

On the first `vo.sh start`, macOS asks whether the app that runs the agent may control VoiceOver. That app is Terminal, iTerm, VS Code, Cursor, or the Claude app. Click **Allow**.

If you clicked **Don't Allow**, change it in System Settings → Privacy & Security → **Automation**. `vo.sh start` reports this case as error -1743.

## 5. Allow the script in your agent (optional)

Agents ask before every shell command. To skip the prompts during a walk, allow the `bash …/voiceover-check/scripts/vo.sh` command in your personal agent settings, for example `.claude/settings.local.json` for Claude Code. Do not add it to a shared settings file.

## Check the setup

First run `bash scripts/vo.sh check`. It starts nothing and reports whether this Mac has VoiceOver and whether AppleScript control is on.

Then run these three commands. VoiceOver speaks while they run.

```bash
bash scripts/vo.sh start
bash scripts/vo.sh last
bash scripts/vo.sh stop
```

`last` prints the last phrase VoiceOver spoke. If it prints text, the setup works.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `check` exits with code 3 | AppleScript control is off | Step 1 |
| `check` exits with code 6 | This is not macOS, or VoiceOver is missing | Do the screen reader check by hand, with VoiceOver on a Mac or NVDA on Windows |
| `start` exits with code 3 and error -1743 | Automation is not allowed | Step 4 |
| `start` exits with code 3 and error -1712 | The Automation prompt was not answered in time | Answer the prompt (step 4), then run `start` again |
| `start` exits with code 3 and another error | AppleScript control is off | Step 1 |
| The agent reports that its sandbox blocks `osascript`, `pgrep`, or `lsappinfo` | The agent's shell sandbox | Allow these commands for this run, or run the check yourself |
| The walk starts in the wrong place | The VoiceOver cursor does not follow the keyboard focus | Step 3, Navigation default |
| The log shows usage hints instead of item names | Hints are on | Step 3 |
| `wait` or `start` exits with code 2 | macOS keeps the terminal in front, so the browser never came forward | Click into the browser window, then let the agent run `wait` and `start` again |
| Role names come out in another language | VoiceOver uses the macOS system language | Expected. Read the roles in that language. |
| Every walk stops with exit code 2 | Another window takes the focus, for example a second browser that an automation tool opened | Close it, or pass that browser's name to `walk` |
