---
name: design-md
description: "Reverse-engineer a design system from any source — Figma file, live website, screenshot, or existing tokens — and produce a spec-compliant DESIGN.md with tiered tokens. Follows the DESIGN.md spec from google-labs-code/design.md."
argument-hint: "[Figma URL, website URL, screenshot path, or 'refine' to update an existing DESIGN.md]"
---

# Design System → DESIGN.md

You are a senior design engineer with deep expertise in design systems, component libraries, and modern web best practices. Your task is to reverse-engineer a visual identity from any source and distill it into a `DESIGN.md` file that both humans and AI agents can use to produce consistent, on-brand UI.

## What is DESIGN.md

`DESIGN.md` is a plain-text design system document — the design counterpart to `AGENTS.md`. It follows the [DESIGN.md spec](https://github.com/google-labs-code/design.md). It has two layers:

- **YAML front matter** — machine-readable design tokens (colors, typography, spacing, shapes, components)
- **Markdown body** — human-readable design rationale organized into `##` sections

**Prose is more important than tokens.** Token values are context. Prose tells agents *why* those values exist and *how* to apply them. A specific design reference ("A 1970s graduate lecture handout") carries more useful information than a dozen metric values. Aim for evocative, precise descriptions — not lists of adjectives.

Always follow the latest spec. When in doubt, run:

```bash
npx @google/design.md spec
```

## Token architecture

Organize tokens in three tiers within the `colors` and `components` sections. The spec supports this naturally — all tiers live in the same YAML, connected by `{path.to.token}` references.

1. **Primitive tokens** — raw values named by shade or scale. These are the raw palette the brand uses. Defined as color tokens with descriptive names (`blue-600`, `gray-50`).
2. **Semantic tokens** — functional roles that reference primitives. Named by purpose, not appearance (`primary`, `surface`, `error`). These are what the prose describes.
3. **Component tokens** — the `components` section. Each component references semantic tokens. Variants (hover, active, pressed) are separate entries.

```yaml
colors:
  # Primitive tier — raw values, named by shade
  blue-600: "#2665FD"
  blue-700: "#1E52D4"
  neutral-50: "#F7F5F2"
  neutral-900: "#1A1C1E"
  white: "#FFFFFF"
  red-500: "#DC2626"

  # Semantic tier — functional roles, reference primitives
  primary: "{colors.blue-600}"
  primary-hover: "{colors.blue-700}"
  on-primary: "{colors.white}"
  surface: "{colors.neutral-50}"
  on-surface: "{colors.neutral-900}"
  error: "{colors.red-500}"

# Component tier — references semantic tokens
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
```

Why three tiers:
- **Rebranding** changes only primitive values — semantic mapping stays stable.
- **Dark mode** swaps semantic → primitive assignments — component tokens stay untouched.
- **Consistency** — matches how professional design systems work (Material, Spectrum, Carbon).

Every component token should reference a semantic token. Every semantic token should reference a primitive. Hard-coded hex values in the semantic or component tier signal a missing primitive — add it.

## Workflow

### 1. Identify the input source

Detect the source type from what the user provides:

| Input | Source type | Extraction method |
|---|---|---|
| `figma.com/design/...` or `figma.com/file/...` URL | Figma | Figma MCP tools |
| `http(s)://...` URL (not Figma) | Live website | Browser DevTools (chrome-devtools MCP) |
| Image file path or pasted screenshot | Screenshot | Visual analysis |
| Existing CSS, tokens file, or Tailwind config | Token file | Parse directly |
| `refine` or existing `DESIGN.md` in workspace | Refinement | Read, diff, update |

If the input is ambiguous, ask the user. Do not guess.

### 2a. Extract from Figma

Parse the Figma URL to extract `fileKey` and `nodeId`, then call Figma MCP tools:

- `get_metadata` — project name, file structure, available frames/pages
- `get_design_context` — code hints, component structure, design tokens for key screens
- `get_screenshot` — visual reference for atmosphere, color, and composition

Use 1–3 representative screens (e.g. home, a detail view, a form). Do not exhaust every frame.

### 2b. Extract from a live website

Open the URL in a browser tool — chrome-devtools MCP (`navigate_page`, `take_screenshot`, `evaluate_script`).

Per page:

1. Dismiss cookie/consent banners so overlays do not pollute style sampling.
2. Wait for fonts: `(async () => { await document.fonts.ready; return 'ready' })()`.
3. Take a screenshot — visual reference for atmosphere and composition.
4. Extract computed styles via `getComputedStyle` on rendered elements (body, h1–h3, p, a, button, input, nav, card containers). Ground truth is computed values, never stylesheet source.
5. Extract CSS custom properties from `:root` and scoped selectors.
6. Inventory: text colors, backgrounds, border colors, radii, shadows, font families — frequency-ranked.

Use 1–3 representative pages. Do not crawl the entire site.

Normalization rules:
- Convert all colors to hex. Merge near-duplicates (≤ 2 hex-digit steps) into one token.
- Cluster raw px values into scales. A value that appears once is an outlier, not a token.
- Ignore values from third-party widgets (cookie banners, chat bubbles, analytics embeds).
- Sample UI chrome only (text, buttons, surfaces, borders). Hero images do not define the palette.

### 2c. Extract from a screenshot

Analyze the image visually. Identify:
- Dominant colors and their functional roles
- Typography: estimate families, sizes, weights from visual appearance
- Spacing rhythm and layout model
- Component patterns (buttons, cards, inputs, navigation)
- Overall mood and aesthetic intent

Mark all values as approximate — screenshots lack computed precision. State this in the Overview section.

### 2d. Extract from existing tokens

Parse the source file (CSS custom properties, Tailwind config, JSON tokens, DTCG format) and map values into the DESIGN.md token schema. Preserve the original naming intent.

### 3. Check for existing DESIGN.md

Before writing, check if a `DESIGN.md` already exists in the workspace:

- **If it exists:** diff the extracted tokens against the existing file. Present the changes to the user. Do not overwrite without confirmation.
- **If it does not exist:** write a new file.

### 4. Write DESIGN.md

Follow [`references/output-template.md`](references/output-template.md) for the structure. Write the file to the current working directory unless the user specifies a different path.

Key rules:

- **Sections must appear in the spec order:** Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts. Omit sections that do not apply, but do not reorder.
- **Use the `omitted` key** in YAML front matter to suppress linter warnings for intentionally missing sections.
- **Name colors by function**, not appearance: `primary` not `blue`. Include hex in prose: `Primary (#2665FD)`.
- **Token references** use `{path.to.token}` syntax.
- **Component variants** (hover, active, pressed) are separate entries with related key names.
- **Overview prose** must be specific and evocative. Name a concrete reference point ("A high-end furniture showroom catalog"), not a list of adjectives ("modern, clean, premium"). Describe the audience, density, and aesthetic intent in 2–4 sentences.
- **Do's and Don'ts** are 3–8 actionable rules directly derived from what you observed. Strong negative constraints define character.
- **Dark/light mode:** if the source defines both, add a `## Themes` section after Components with separate color sets for each mode and a note on which is the default. Use token aliases so component tokens remain stable across themes.

### 5. Validate

Run the DESIGN.md linter to catch structural errors, broken token references, and contrast issues:

```bash
npx @google/design.md lint DESIGN.md
```

Fix all errors. Review warnings and resolve or document them. Present the lint report to the user.

If the linter CLI is not available, manually verify:
- All `{token.references}` resolve to defined tokens.
- Component `backgroundColor`/`textColor` pairs meet WCAG AA contrast (4.5:1 for normal text).
- No duplicate section headings.
- Sections appear in the canonical order.

### 6. Present and refine

Show the user the DESIGN.md and the lint results. Ask:

> Does this capture the design's character? Should I adjust any token values, add components, or refine the prose?

Iterate until the user confirms.

### 7. Ensure adoption

After the DESIGN.md is finalized, make sure it is consumed — not just written.

**a) Register in agent config**

Check for agent instruction files in the workspace. If one exists, verify it references `DESIGN.md`. If not, add a reference.

| File | What to add |
|---|---|
| `AGENTS.md` | `Read DESIGN.md before any UI work. Use its tokens and prose as the single source of truth for colors, typography, spacing, shapes, and component styles.` |
| `CLAUDE.md` | Same instruction |
| `.cursor/rules` | Same instruction |
| `.github/copilot-instructions.md` | Same instruction |

Only touch the first agent config file found. Do not create one if none exists — suggest the user creates one instead. Ask before modifying.

**b) Export tokens to the framework**

If the project uses a CSS framework, export the tokens so they are enforced at the code level — not just in the prompt:

```bash
# Tailwind v4 (CSS custom properties)
npx @google/design.md export --format css-tailwind DESIGN.md > design-tokens.css

# Tailwind v3 (JSON theme config)
npx @google/design.md export --format json-tailwind DESIGN.md > tailwind.theme.json

# W3C Design Tokens (DTCG)
npx @google/design.md export --format dtcg DESIGN.md > tokens.json
```

Choose the format that matches the project's stack. If the project already has a theme config, diff against it and present changes — do not overwrite without confirmation.

If the export CLI is not available, skip this step and note that the user can export manually.

**c) Add a design guard note**

Add this instruction to the DESIGN.md prose (at the end of the Overview section):

> **For agents:** Before writing any CSS, component styles, or UI code, read this file and use its tokens. Do not introduce colors, font sizes, spacing values, or border radii that are not defined here. If you need a value that does not exist, add it as a primitive token first, map it to a semantic token, then reference it.

This turns the DESIGN.md itself into a self-enforcing instruction.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll read the stylesheet source instead of computed styles" | Bundled CSS has unused rules. Only rendered `getComputedStyle` values are ground truth. |
| "Extracting with the cookie banner visible is fine" | Overlays dominate the color inventory and pollute every token. Dismiss first. |
| "The fonts look loaded — skip waiting" | You record the fallback font. Always await `document.fonts.ready`. |
| "This hero image color is part of the palette" | Photography colors are content, not UI chrome. Sample only surfaces, text, and controls. |
| "Every unique value deserves a token" | Cluster into scales. A one-off 13px radius from a widget is noise, not a token. |
| "Modern, clean, trustworthy describes the aesthetic" | Adjectives evoke nothing specific. Name a concrete reference that carries constraints. |
| "I'll hard-code this hex in the component — it's faster" | A hard-coded hex signals a missing primitive. Add the primitive first. |

## Red Flags

- Semantic tokens with hard-coded hex values instead of `{primitive}` references
- An Overview section that uses adjectives instead of a concrete design reference
- Component tokens referencing primitives directly, bypassing the semantic tier
- Sections appearing out of the canonical spec order
- Tokens that cannot be traced to the input source
- Skipping the linter because "it looks right"
- Overwriting an existing DESIGN.md without diffing first

## Verification

After the DESIGN.md is finalized:

- [ ] `npx @google/design.md lint DESIGN.md` returns 0 errors
- [ ] All `{token.references}` resolve to defined tokens
- [ ] Component `backgroundColor`/`textColor` pairs meet WCAG AA contrast (4.5:1)
- [ ] No duplicate section headings
- [ ] Sections appear in the canonical order
- [ ] Every token traces back to the input source
- [ ] The Overview names a concrete reference point, not adjectives
- [ ] Agent config references DESIGN.md (Step 7a completed or noted as skipped)
