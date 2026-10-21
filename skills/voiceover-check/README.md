# voiceover-check

Checks a web page with the real macOS VoiceOver screen reader. The agent drives VoiceOver through its own AppleScript interface, records what it says, and compares it with what the user must hear: reading order, accessible names, live-region and toast announcements, and dialog titles. Use it when a ticket asks for a screen reader test, or when a change touches announcements or focus moves.

It asks before it starts VoiceOver, stops when another app comes to the front, and always quits VoiceOver at the end. It changes no system settings.

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

The agent will:

1. **Check the machine**: macOS, VoiceOver, and AppleScript control. If one is missing, it tells you what to do and starts nothing.
2. **Check in the browser**: find the component in an accessibility snapshot, list the browser's own accessibility issues, and choose the checks for the component (dialog, form, live region, menu) from [references/checks.md](references/checks.md).
3. **Ask first**: what it checks, in which browser, and how long it takes. After your OK, you click into the browser window and keep your hands off the keyboard.
4. **Start**: wait until the browser is in front, then start VoiceOver.
5. **Walk**: move the VoiceOver cursor item by item and log what is spoken. Usage hints do not replace the item text.
6. **Listen**: move to the control, press VO-Space while it listens, and log every announcement. It repeats each check 3 times and passes only at 3 of 3.
7. **Stop and report**: quit VoiceOver, confirm each finding in the DOM, and report expected versus spoken text per check, with severity, WCAG criterion, and a fix pointer.

## Output

```text
voiceover-check/
├── SKILL.md                         — Agent instructions
├── README.md                        — This file
├── references/setup.md              — One-time setup and troubleshooting
├── references/checks.md             — Checks per component, WCAG criteria, severity
├── references/report-template.md    — Report format
└── scripts/vo.sh                    — check, wait, start, stop, front, last, walk, seek, act, into, out, poll
```

## When to use it

After axe and a keyboard test pass, when you must know what a screen reader user actually hears. It is useful for live regions, toasts, dialogs, and focus moves, because the accessibility tree cannot show whether VoiceOver speaks them.
