---
name: jvm-design
description: Bootstrap a new project with the Jung von Matt CI 2026 design system — copies DESIGN.md, brand assets, and fonts into the project root so agents can auto-discover them.
argument-hint: "[path to project root, defaults to ./]"
---

# JvM Design System Bootstrap

You are setting up a project to use the Jung von Matt CI 2026 design system. Your job is to copy the design resources from this skill into the target project so agents can auto-discover them without needing this skill at runtime.

## Workflow

### 1. Determine the target project root

Use the path provided by the user, or default to the current working directory (`./`).

### 2. Copy design resources into the project

Run the following from the skill directory, substituting `$PROJECT_ROOT` with the target path:

```bash
# Design system spec — auto-discovered by agents at the project root
cp DESIGN.md $PROJECT_ROOT/DESIGN.md

# Brand assets (tokens CSS, logos)
cp -r assets $PROJECT_ROOT/assets

# Font files
cp -r fonts $PROJECT_ROOT/fonts
```

### 3. Verify

Confirm these files exist in the project root:
- `DESIGN.md` — design system spec with YAML tokens + rationale prose
- `assets/_tokens.css` — CSS custom properties for all tokens + `@font-face` declarations
- `assets/JvM_Logo.svg`, `assets/horse-green.svg`, `assets/horse-white.svg` — brand assets
- `fonts/Carloschi*.woff2` — all Carloschi weight variants

### 4. Inform the developer

Tell the developer:
- The design system is now bootstrapped. Agents will read `DESIGN.md` automatically.
- Use `assets/_tokens.css` as the CSS foundation for any web project.
- Do not import external fonts — Carloschi is self-hosted in `./fonts`.
- This skill is no longer needed; the project is self-contained.

## Design System Reference

Do not apply the design system yourself during bootstrap — that happens later, guided by the project-local `DESIGN.md`. If the user asks you to also build something after bootstrapping, read `$PROJECT_ROOT/DESIGN.md` (not the skill-local copy) and follow its tokens and rationale.
