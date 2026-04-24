---
version: alpha
name: Jung von Matt 2026 DESIGN
description: Jung von Matt design system — bold agency CI for use across agents, tools, and deliverables.
colors:
  primary: "#0a342d"
  accent: "#00eb73"
  surface: "#ffffff"
  on-primary: "#ffffff"
  on-surface: "#0a342d"
typography:
  display:
    fontFamily: Carloschi Headline
    fontSize: 350px
    fontWeight: 900
    lineHeight: 1.01
    letterSpacing: 0.001em
  headline:
    fontFamily: Carloschi Headline
    fontSize: 90px
    fontWeight: 900
    lineHeight: 1.01
    letterSpacing: 0.004em
  label-lg:
    fontFamily: Carloschi
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.2em
  label-sm:
    fontFamily: Carloschi
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.2em
  body:
    fontFamily: Carloschi
    fontSize: 35px
    fontWeight: 300
    lineHeight: 1.14
    letterSpacing: 0em
rounded:
  none: 0px
spacing:
  page-margin: 57px
  content-gap: 40px
  section-gap: 80px
  column-gutter: 16px
components:
  surface-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  surface-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
  section-label:
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
---

# Design System: JvM CI 2026
## Overview
A bold, editorial design system for Jung von Matt — the agency's own corporate identity. The atmosphere is assertive, precise, and unmistakably German creative: big letterforms, deep forest green, a single neon accent, and zero ornamentation.

The system balances two modes: a **dark, immersive variant** with the brand's deep-green signature background hosting white or neon-green type, and a **light, documentary variant** with a clean white canvas and dark-green typography. Both variants share the same typographic logic and shape language, ensuring visual coherence across any deliverable or interface.

This is not a neutral corporate template. It is an agency's proof of conviction — heavy type, heavy color, no compromise.

## Colors
The palette is built on a two-color brand core with a single pure white utility tone.

- **Primary — Deep Forest Green (`#0a342d`):** The signature JvM dark green. Used as the full-bleed background on impact slides (title, imprint, closing). Also used as the primary text color on light-background slides. Dense, luxurious, and unmistakably on-brand.
- **Accent — Electric Neon Green (`#00eb73`):** The brand's electric pulse. Reserved exclusively for maximum-attention moments: oversized decorative wordmarks and typographic devices. Used sparingly; never for body text or captions. When it appears it dominates.
- **Surface — Pure White (`#ffffff`):** The light-theme canvas. Used for content-heavy slides (team grids, data, multi-column layouts) where legibility and airiness are required. Keeps information readable without the weight of the dark mode.
- **On-Primary — White (`#ffffff`):** All text rendered on top of the Primary dark-green background.
- **On-Surface — Deep Forest Green (`#0a342d`):** All text rendered on top of the white surface.

## Typography
The entire system is built on a single typeface family: **Carloschi** — a custom condensed display grotesque. Carloschi is used across all three weights in distinct semantic roles, creating hierarchy through weight and spacing alone.

- **Headlines / Display — Carloschi Headline (Black / 900):** Used for all primary headline content and large typographic devices. Always uppercase. Rendered at massive scale — slide titles span 350px or more. Tracking is near-zero (tight to neutral), letting the condensed letterforms do the structural work. No mixed case; this weight is too heavy for readable sentence case at scale.
- **Body / Legal — Carloschi (Book / 300):** The reading weight. Used for multi-sentence body copy on content slides: explanatory text, legal language, longer descriptive passages. Set at 35px with a generous 1.14 line height to remain readable on-screen from a distance.
- **Labels / Captions — Carloschi (Regular / 400):** Used for all metadata, section headers, event details, and captions. Always uppercase. Defined by wide letter-spacing — 0.2em (5.6px at 28px, 3.6px at 18px) — which creates a composed, refined quality despite the bold brand context.

## Layout
Layouts follow two fundamental patterns:

**Dark surfaces** anchor typography to the lower portion of the container, letting the dark field breathe above. Decorative oversized type (wordmarks, single words) may be rotated 90° counter-clockwise and positioned along the left edge, functioning as a structural vertical bar rather than readable text. Content copy occupies the right half.

**Light surfaces** use an even column grid with generous top-area whitespace for a section label. A centered eyebrow label in small-tracked capitals anchors the visual hierarchy above the grid.

Spacing follows a consistent rhythm:
- Page margin / bleed guard: ~57px from edge
- Internal content gap (between text blocks): 40px
- Section gap (between modules or zones): 80px

## Elevation & Depth
Completely flat. No shadows, no blur effects, no gradients. Depth is achieved through:
- **Tonal contrast:** The stark opposition of the deep forest green against either white or electric green creates instant visual layering without physical shadow.
- **Scale contrast:** Oversized decorative type at 350–545px sits behind or beside smaller reading text; size alone suggests foreground/background relationship.
- **Color role:** The neon accent reads as an energetic foreground element regardless of z-position because of its extreme saturation contrast against the dark ground.

Do not add box shadows, drop shadows, or inner glows. The system is deliberately shadow-free.

## Shapes
All edges are sharp. Border radius: 0px across all elements — slides, photo placeholders, containers, text boxes. No pills, no rounded cards, no softened corners. The geometry is strictly rectilinear, reflecting the precise, engineered confidence of the JvM brand identity.

Photo placeholders (team card headshots) are square or portrait rectangles with zero rounding.

## Do's and Don'ts
- **Do** use Carloschi Headline Black exclusively for slide titles and decorative display text. Never use lighter weights for headlines.
- **Do** keep all text uppercase in headline and label roles. Never use mixed case for Carloschi Headline Black.
- **Do** apply Electric Neon Green (`#00eb73`) only to the oversized decorative wordmark element. Never use it for body text, captions, or labels.
- **Do** maintain sharp, zero-radius geometry for all containers and photo elements.
- **Don't** add shadows, gradients, or transparency effects. The system is intentionally flat.
- **Don't** introduce additional typefaces. Carloschi is the sole typeface family across all weights and roles.
- **Don't** mix dark-theme and light-theme elements within a single slide. Each slide commits to one background mode.
- **Don't** scale down the display wordmark below a commanding size — if the rotated wordmark fits comfortably alongside body text without visual tension, it is too small.
- **Don't** use color for decorative purposes beyond the defined palette. Never introduce blues, reds, or secondary brand tones from unrelated systems.
