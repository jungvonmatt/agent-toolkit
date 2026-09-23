---
name: jvm-design
description: Use when a project must adopt the Jung von Matt (JvM) CI 2026 design system, brand assets, or Carloschi fonts, or when asked to set up the JvM DESIGN.md in a project.
argument-hint: "[path to project root, defaults to ./]"
---

# JvM Design System Bootstrap

You are setting up a project to use the Jung von Matt CI 2026 design system. Your job is to copy the design resources from this skill into the target project so agents can auto-discover them without needing this skill at runtime.

## Workflow

### 1. Determine the target project root

Use the path provided by the user, or default to the current working directory (`./`).

### 2. Check for conflicts

Before copying, check whether the target already contains `DESIGN.md`, `assets/tokens.css`, `assets/logo.svg`, `assets/horse-green.svg`, `assets/horse-white.svg`, or any `fonts/Carloschi*.woff2`. If any exist, list them and ask the user before overwriting. Existing `assets/` and `fonts/` directories are fine — the copy adds files to them.

### 3. Copy design resources into the project

Set `SKILL_DIR` to the absolute path of the directory that contains this `SKILL.md`, and `PROJECT_ROOT` to the target path:

```bash
mkdir -p "$PROJECT_ROOT/assets" "$PROJECT_ROOT/fonts"

# Design system spec — auto-discovered by agents at the project root
cp "$SKILL_DIR/DESIGN.md" "$PROJECT_ROOT/DESIGN.md"

# Brand assets (tokens CSS, logos)
cp "$SKILL_DIR"/assets/* "$PROJECT_ROOT/assets/"

# Font files — tokens.css loads them from ../fonts/
cp "$SKILL_DIR"/fonts/*.woff2 "$PROJECT_ROOT/fonts/"
```

### 4. Verify

Confirm these files exist in the project root:
- `DESIGN.md` — design system spec with YAML tokens + rationale prose
- `assets/tokens.css` — CSS custom properties for all tokens + `@font-face` declarations
- `assets/logo.svg`, `assets/horse-green.svg`, `assets/horse-white.svg` — brand assets
- `fonts/Carloschi*.woff2` — all Carloschi weight variants

### 5. Inform the developer

Tell the developer:
- The design system is now bootstrapped. Agents will read `DESIGN.md` automatically.
- Use `assets/tokens.css` as the CSS foundation for any web project.
- Do not import external fonts — Carloschi is self-hosted in `./fonts`.
- This skill is no longer needed; the project is self-contained.

## Design System Reference

Do not apply the design system yourself during bootstrap — that happens later, guided by the project-local `DESIGN.md`. If the user asks you to also build something after bootstrapping, read `$PROJECT_ROOT/DESIGN.md` (not the skill-local copy) and follow its tokens and rationale.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll reference the DESIGN.md from the skill directory" | The project must be self-contained. Agents won't have this skill at runtime. |
| "The fonts are available via CDN" | The design system requires self-hosted fonts. CDN introduces an external dependency. |
| "I'll apply the design system during bootstrap" | Bootstrap copies resources. Application happens later guided by the project-local DESIGN.md. |
| "The tokens.css file isn't needed — I'll use the DESIGN.md values directly" | tokens.css is the CSS foundation. Agents and developers consume it at build time. |

## Red Flags

- Importing fonts from Google Fonts or another CDN instead of self-hosting
- Reading DESIGN.md from the skill directory instead of the project root
- Applying design system styles during the bootstrap step
- Missing font files in the project's `fonts/` directory
- An empty or truncated DESIGN.md in the project root

## Verification

After bootstrapping:

- [ ] `DESIGN.md` exists in the project root and starts with YAML front matter
- [ ] `assets/tokens.css` exists and contains `--` custom properties
- [ ] `fonts/` directory contains at least 4 `.woff2` files
- [ ] No existing project file was overwritten without the user's confirmation
- [ ] Any follow-up UI work reads the project-local `DESIGN.md`, not the skill copy
- [ ] The user was informed that the project is now self-contained
