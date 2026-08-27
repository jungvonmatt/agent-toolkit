# Output Template

The DESIGN.md output follows the [DESIGN.md spec](https://github.com/google-labs-code/design.md). Use `npx @google/design.md spec` to retrieve the latest spec if in doubt.

## Structure

```markdown
---
version: alpha
name: <Project Name>
description: <One-line design system summary>
omitted:                          # optional — suppress linter warnings
  - section: <section name>
    reason: "<why this section is not applicable>"
colors:
  # Primitive tier — raw values, named by shade
  blue-600: "#hex"
  blue-700: "#hex"
  neutral-50: "#hex"
  neutral-900: "#hex"
  white: "#FFFFFF"
  red-500: "#hex"

  # Semantic tier — functional roles, reference primitives
  primary: "{colors.blue-600}"
  primary-hover: "{colors.blue-700}"
  on-primary: "{colors.white}"
  secondary: "{colors.<primitive>}"
  on-secondary: "{colors.<primitive>}"
  tertiary: "{colors.<primitive>}"
  neutral: "{colors.<primitive>}"
  surface: "{colors.neutral-50}"
  on-surface: "{colors.neutral-900}"
  error: "{colors.red-500}"
typography:
  headline-display:
    fontFamily: <Family>
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: <Family>
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
  body-md:
    fontFamily: <Family>
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: <Family>
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.04em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  base: 16px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 24px
  margin: 32px
components:
  # Component tier — references semantic tokens only
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
---

# <Project Name>

## Overview

<2–4 sentences. Name a specific, concrete reference point — not adjectives. Describe the audience, the density, and the emotional intent. This is the most important paragraph in the file.>

## Colors

<Describe each color's functional role. Use descriptive names alongside hex values.>

- **Primary (#hex):** <role — what it anchors>
- **Secondary (#hex):** <role — where it supports>
- **Tertiary (#hex):** <role — the sole accent, interaction driver>
- **Neutral (#hex):** <role — foundation surface>
- **Surface (#hex):** <role — card/page canvas>

## Typography

<Describe the typographic strategy: how many families, what character they bring, and how the hierarchy works.>

- **Headlines:** <Family>, <weight>, <character and role>
- **Body:** <Family>, <weight>, <size>, <readability intent>
- **Labels:** <Family>, <weight>, <when and why>

## Layout

<Grid model, max-width, spacing base unit, responsive strategy.>

## Elevation & Depth

<Shadow strategy or flat/tonal approach. If flat, explain how hierarchy is achieved.>

## Shapes

<Corner radius philosophy: what the shape language communicates.>

## Components

<Style guidance for key atoms. Describe shape, fill, states, and interaction behavior.>

- **Buttons:** <shape, fill, hover/focus behavior>
- **Inputs:** <border, background, focus state>
- **Cards:** <elevation, border, padding, hover>
- **Navigation:** <layout, active indicator, mobile behavior>

## Do's and Don'ts

- Do <rule derived from observation>
- Do <rule>
- Don't <rule — strong negative constraints define character>
- Don't <rule>
```

## Template rules

- Every token in YAML front matter must be grounded in observed evidence from the source. Do not invent tokens.
- Colors use a three-tier architecture: primitives (raw hex, named by shade) → semantic (functional roles, reference primitives) → components (reference semantic tokens).
- Hard-coded hex values belong only in the primitive tier. Semantic and component tiers use `{path.to.token}` references.
- Prose names colors by their semantic role (`primary`), not their primitive name (`blue-600`) or appearance (`blue`). Include hex for human reference.
- The Overview section names a concrete reference point, not adjectives. "A high-end furniture showroom catalog" > "modern, clean, premium".
- Do's and Don'ts are directly derived from what you observed, not generic best practices.
- Sections appear in the canonical order. Omitted sections use the `omitted` YAML key with a reason.
- After writing, validate with `npx @google/design.md lint DESIGN.md`.
