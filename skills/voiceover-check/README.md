# voiceover-check

Checks a web page with the real macOS VoiceOver screen reader. The agent drives VoiceOver through its own AppleScript interface, records what it says, and compares it with what the user must hear: reading order, accessible names, live-region and toast announcements, and dialog titles. Use it when a ticket asks for a screen reader test, or when a change touches announcements or focus moves.

It asks before it starts VoiceOver, stops when another app or launched-browser instance comes to the front, and quits the VoiceOver session it started at the end. It leaves a pre-existing user session on unless the user agrees to stop it. It changes no system settings.

## Requirements

- macOS with VoiceOver.
- A one-time setup by a person: AppleScript control on, welcome dialog closed, Automation allowed. See [references/setup.md](references/setup.md).
- Not for CI or unattended runs. VoiceOver takes over the machine while it runs.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/voiceover-check --global
```

## Usage

```text
Check with VoiceOver that the error toast is announced after a failed add to bag on http://localhost:3000/p/123
```

```text
Run a screen reader pass on the checkout dialog: is the title read when it opens?
```

```text
/jvm-skills:voiceover-check http://localhost:3000/cart
```

For a manual feature check, no PR or Git diff is needed:

```text
/jvm-skills:voiceover-check http://localhost:3000
mode: targeted
scope: Main navigation including its submenus
browser: Chrome, existing tab
```

Natural language works too: "Test only the newsletter module with VoiceOver: field names, invalid submission, and the success announcement."

Without an explicit mode, a named feature selects `targeted`; otherwise the whole page is checked (`full`). Both modes check each distinct state once by default. Repeat only an affected step to investigate uncertainty or satisfy an explicit repeatability requirement. There is no total time budget or time-based cutoff. A valid failure remains a finding even if a follow-up succeeds.

Other skills can pass URL/browser/state, feature and affected consumers, scenarios with requirement-backed expectations, scope boundaries, and prior knowledge. The handoff contract lives in [SKILL.md](SKILL.md). A code-informed check is reported as guided, and an introduced regression requires baseline evidence.

The agent will:

1. **Check the machine**: macOS, VoiceOver, and AppleScript control. If one is missing, it tells you what to do and starts nothing.
2. **Prepare**: honor the browser and existing page you request. Check the whole page unless you name a component, then restrict the checks to it. Choose from [references/checks.md](references/checks.md) without inspecting the DOM before the run.
3. **Ask first**: what it checks, in which browser, and how long it takes. After your OK, keep your hands off the keyboard.
4. **Start**: bring the chosen browser forward, verify focus, then start VoiceOver. Unless you request an existing page, Chromium uses a separate instance with a fresh profile and PID-bound interactions. This does not guarantee the initial cursor position: the agent confirms the page and its web-content role through VoiceOver. If activation fails, click during a timed wait without replying again.
5. **Navigate**: discover this Mac's VoiceOver commands for headings, landmarks, and controls. Use those to locate content and a sequential walk to check reading order. Log spoken text, not usage hints.
6. **Listen**: activate the control while sampling changes to VoiceOver's last phrase. Check each relevant state once and record the reason for any repeat. Observed failures, blocked attempts, and incomplete checks are reported separately. A successful 1/1 does not prove ongoing reliability; identical repeated or rapidly replaced phrases can be missed by sampling.
7. **Stop, verify, and clean up**: stop VoiceOver, inspect causes in the same test instance and state when possible, then close the launched browser. If only source or another browser is available, leave runtime causes unverified. Report expected versus spoken text, run counts, severity, and applicable WCAG criteria.

## Output

```text
voiceover-check/
├── SKILL.md                         — Agent instructions
├── README.md                        — This file
├── references/setup.md              — One-time setup and troubleshooting
├── references/checks.md             — Checks per component, WCAG criteria, severity
├── references/report-template.md    — Report format
└── scripts/vo.sh                    — check, launch, close, focus, wait, start, stop, front, last, walk, seek, back, seekback, act, into, out, commands, do, web, poll
```

## When to use it

After axe and a keyboard test pass, when you must know what a screen reader user actually hears. It is useful for live regions, toasts, dialogs, and focus moves, because the accessibility tree cannot show whether VoiceOver speaks them.
