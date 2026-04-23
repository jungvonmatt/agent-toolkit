---
name: design-md
description: Analyze Figma design files and synthesize a semantic design system into DESIGN.md files
argument-hint: "[Figma project URL]"
---

# Figma → DESIGN.md Skill

You are a Design Systems Lead. Given a Figma project URL, use the Figma MCP to extract the design language and write a `DESIGN.md` file in the current working directory.

## What is DESIGN.md

`DESIGN.md` is a plain-text design system document readable by both humans and agents — the design counterpart to `AGENTS.md`. Follows the [DESIGN.md spec](https://github.com/google-labs-code/design.md). It has two layers:

- **YAML front matter** — machine-readable design tokens (exact hex values, font properties, spacing scales)
- **Markdown body** — human-readable design rationale organized into `##` sections

Tokens are the normative values. Prose explains how and why to apply them.

## Workflow

### 1. Retrieve design context from Figma

Parse the Figma URL to extract `fileKey` and `nodeId`, then call Figma MCP tools:

- `get_metadata` — project name, file structure, available frames/pages
- `get_design_context` — code hints, component structure, design tokens for the key screen(s)
- `get_screenshot` — visual reference for atmosphere, color, and composition

Use 1–3 representative screens (e.g. Home, a detail view, a form). Do not exhaust every frame.

### 2. Extract design tokens

From the Figma output, identify:

| Token group | What to extract |
|---|---|
| `colors` | Hex values for primary, secondary, surface, text, error roles |
| `typography` | fontFamily, fontSize, fontWeight, lineHeight per semantic level (h1, body-md, label-sm…) |
| `rounded` | Corner radius scale (sm, md, lg, full) |
| `spacing` | Base unit and scale (xs, sm, md, lg, xl, gutter, margin) |
| `components` | Key atoms: button-primary, input, card — with backgroundColor, textColor, rounded, padding |

Token references use `{path.to.token}` syntax (e.g. `{colors.primary}`).

### 3. Write DESIGN.md

Produce the file with YAML front matter followed by the markdown body. Sections can be omitted if not applicable; present sections must follow this order:

1. Overview
2. Colors
3. Typography
4. Layout
5. Elevation & Depth
6. Shapes
7. Components
8. Do's and Don'ts

## Output Format

```markdown
---
version: alpha
name: [Project Name]
colors:
  primary: "#hex"
  secondary: "#hex"
  surface: "#hex"
  on-surface: "#hex"
  error: "#hex"
typography:
  h1:
    fontFamily: [Family]
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  body-md:
    fontFamily: [Family]
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
---

# [Project Name]

## Overview
[Concise mood/philosophy — 2–4 sentences. Audience, density, aesthetic intent.]

## Colors
- **[Descriptive name] ([hex]):** [Functional role]
- …

## Typography
- **[Level]:** [Family], [weight], [size], [role]
- …

## Layout
[Grid model, max-width, spacing base unit.]

## Elevation & Depth
[Shadow strategy or flat/tonal approach.]

## Shapes
[Corner radius philosophy and scale usage.]

## Components
- **Buttons:** [Shape, fill, hover behavior]
- **Inputs:** [Border, background, focus state]
- **Cards:** [Elevation, border, padding]

## Do's and Don'ts
- Do [rule]
- Don't [rule]
```

## Token naming conventions

**Colors:** `primary`, `secondary`, `tertiary`, `neutral`, `surface`, `on-surface`, `error`  
**Typography:** `headline-display`, `headline-lg`, `headline-md`, `body-lg`, `body-md`, `body-sm`, `label-lg`, `label-md`, `label-sm`  
**Rounded:** `none`, `sm`, `md`, `lg`, `xl`, `full`

## Writing guidelines

- Name colors by function, not appearance (`primary` not `blue`). Include hex in prose: `Primary (#2665FD)`.
- Typography prose: describe semantic role and character, not raw CSS values.
- Elevation: if flat, say so and explain how hierarchy is achieved instead.
- Do's and Don'ts: 3–6 actionable rules, directly derived from what you observed in the design.
