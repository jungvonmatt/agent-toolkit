# JVM Design Bootstrap Skill

Bootstraps a project with the Jung von Matt CI 2026 design system — copies `DESIGN.md`, brand assets, and fonts into the project root so agents auto-discover them without needing this skill at runtime.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/jvm-design --global
```

## Usage

Run once per workspace/project/repository to set it up:

```text
/jvm-design 
```

Or with an explicit path:

```text
/jvm-design ./my-project
```

After bootstrapping, the skill is no longer needed. Agents read `DESIGN.md` at the project root automatically.

## How it works

1. **Copy** — Copies `DESIGN.md`, `assets/`, and `fonts/` from the skill into the target project root.
2. **Done** — Agents auto-discover `DESIGN.md` the same way they discover `AGENTS.md`. No skill invocation required at runtime.

## What gets copied

| Resource | Destination | Purpose |
|---|---|---|
| `DESIGN.md` | `$PROJECT_ROOT/DESIGN.md` | Design system spec — auto-discovered by agents |
| `assets/tokens.css` | `$PROJECT_ROOT/assets/tokens.css` | CSS custom properties + `@font-face` declarations |
| `assets/*.svg` | `$PROJECT_ROOT/assets/` | JvM logo and brand mark variants |
| `fonts/Carloschi*.woff2` | `$PROJECT_ROOT/fonts/` | Self-hosted Carloschi typeface |

## Skill contents

```text
skills/jvm-design-system/
├── SKILL.md       — Bootstrap workflow instructions for agents
├── DESIGN.md      — JvM CI 2026 design system spec (source of truth)
├── assets/        — Design tokens CSS, logo SVGs
├── fonts/         — Carloschi woff2 font files
└── README.md      — This file
```
