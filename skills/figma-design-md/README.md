# design-md

Analyzes a Figma project via the Figma MCP and writes a `DESIGN.md` file — a plain-text design system document readable by both humans and AI agents.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/figma-design-md --global
```

## Usage

Point the agent at a Figma URL:

```text
Generate a DESIGN.md for figma.com/design/abc123/My-App
```

## How it works

1. **Retrieve** — Calls Figma MCP (`get_metadata`, `get_design_context`, `get_screenshot`) on 1–3 representative screens.
2. **Extract** — Pulls colors, typography, spacing, shape, and component tokens.
3. **Write** — Produces `DESIGN.md` with YAML front matter (machine-readable tokens) + markdown body (design rationale).

## Output

```text
design-md/
├── SKILL.md       — Agent instructions & workflow
├── examples/      — Sample DESIGN.md outputs
└── README.md      — This file
```
