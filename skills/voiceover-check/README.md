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
2. **Ask first**: what it checks and how long it takes.
3. **Prepare**: open the page in a visible browser, set the page state, focus the start element, and start VoiceOver.
4. **Walk**: move the VoiceOver cursor item by item and log what is spoken.
5. **Listen**: move to the control, press VO-Space while it listens, and log every announcement. It repeats each check 3 times and passes only at 3 of 3.
6. **Stop and report**: quit VoiceOver and report expected versus spoken text per criterion.

## Output

```text
voiceover-check/
├── SKILL.md              — Agent instructions
├── README.md             — This file
├── references/setup.md   — One-time setup and troubleshooting
└── scripts/vo.sh         — check, start, stop, front, last, walk, seek, act, into, out, poll
```

## When to use it

After axe and a keyboard test pass, when you must know what a screen reader user actually hears. It is useful for live regions, toasts, dialogs, and focus moves, because the accessibility tree cannot show whether VoiceOver speaks them.
