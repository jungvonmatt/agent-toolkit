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
    letterSpacing: 0
  headline:
    fontFamily: Carloschi Headline
    fontSize: 90px
    fontWeight: 900
    lineHeight: 1.01
    letterSpacing: 0
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
  body-web:
    fontFamily: Carloschi
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
rounded:
  none: 0px
spacing:
  page-margin: 57px
  content-gap: 40px
  section-gap: 80px
  column-gutter: 16px
  slide-gap: 24px
  grid-columns: 12
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
  nav-logo:
    height: auto
    maxHeight: 56px
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 20px 64px
  button-primary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  nav-link:
    typography: "{typography.body-web}"
    textColor: "{colors.on-primary}"
  card-selector:
    backgroundColor: transparent
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    padding: 32px
  card-selector-selected:
    backgroundColor: "rgba(0,235,115,0.08)"
    textColor: "{colors.on-primary}"
  form-field:
    backgroundColor: transparent
    textColor: "{colors.on-primary}"
---

# Design System: JvM CI 2026
## Overview
A bold, editorial design system for Jung von Matt — the agency's own corporate identity. The atmosphere is assertive, precise, and unmistakably German creative: big letterforms, deep forest green, a single neon accent, and zero ornamentation.

The system balances two modes: a **dark, immersive variant** with the brand's deep-green signature background hosting white or neon-green type, and a **light, documentary variant** with a clean white canvas and dark-green typography. Both variants share the same typographic logic and shape language, ensuring visual coherence across any deliverable or interface.

This is not a neutral corporate template. It is an agency's proof of conviction — heavy type, heavy color, no compromise.

**Brand logo:** The official wordmark SVG is at `assets/logo.svg`. This is a geometric, all-caps typographic mark in Deep Forest Green. Always embed or reference this asset for any brand representation — never typeset the company name in Carloschi or any other font. In HTML, use `<img src="assets/logo.svg" alt="Jung von Matt">` or inline the SVG source directly — never use a text node, letter span, or any other character-based representation of the wordmark. The company name is **Jung von Matt** — no ampersand, no punctuation, no abbreviation. The logo fill color can be replaced with white (`#ffffff`) or black (`#000000`).

## Colors
The palette has a three-color brand core plus two text utilities.

- **Primary — Deep Forest Green (`#0a342d`):** The signature JvM dark green. Used as the full-bleed background on dark-mode surfaces (pages, sections, footer). Also the primary text color on white surfaces.
- **Accent — Electric Neon Green (`#00eb73`):** The brand's electric pulse. Used for decorative oversized wordmarks, primary CTA buttons, and key accent moments. Never use it for body text, running copy, or as a large fill area. When it appears it dominates.
- **Surface — Pure White (`#ffffff`):** The light-theme canvas for content-heavy sections.
- **On-Primary — White (`#ffffff`):** All text rendered on top of the Primary dark-green background.
- **On-Surface — Deep Forest Green (`#0a342d`):** All text rendered on top of the white surface.

## Typography
The entire system is built on a single typeface family: **Carloschi** — a custom condensed display grotesque. Carloschi is used across all weights in distinct semantic roles.

Typography tokens exist at two scales:
- **Slide scale** — for presentations and large-format deliverables (display: 350px, headline: 90px, body: 35px)
- **Web scale** — for the website and web interfaces (body-web: 16px Regular)

- **Headlines / Display — Carloschi Headline (Black / 900):** All primary headline content and large typographic devices. Always uppercase. Letter-spacing is exactly 0 — no positive or negative tracking is ever applied to this weight.
- **Body / Legal — Carloschi (Book / 300):** Multi-sentence body copy. Set at 35px for slide use; scale proportionally for web (typically 18–22px).
- **Labels / Captions — Carloschi (Regular / 400):** Metadata, section headers, navigation, event details. On the website, navigation links use Carloschi Regular at 16px. Always uppercase with wide tracking (0.2em).
- **Web body — Carloschi (Regular / 400):** Running copy on the website at 16px, line-height 1.5, no extra tracking.

DO NOT USE REDUCED LETTER SPACING ON HEADLINES (!)

## Layout
Layouts follow two fundamental patterns:

**Dark surfaces** anchor typography to the lower portion of the container, letting the dark field breathe above. Decorative oversized type (wordmarks, single words) may be rotated 90° counter-clockwise and positioned along the left edge, functioning as a structural vertical bar rather than readable text. Content copy occupies the right half.

**Light surfaces** use an even column grid with generous top-area whitespace for a section label. A centered eyebrow label in small-tracked capitals anchors the visual hierarchy above the grid.

Spacing follows a consistent rhythm:
- Page margin / bleed guard: ~57px from edge
- Internal content gap (between text blocks): 40px
- Section gap (between modules or zones): 80px

**Web layouts** follow a 12-column grid with 16px gutters. Do not use horizontal rules, borders, or divider lines as separators — separation is achieved through background color contrast and vertical spacing alone. Thin vertical accent lines (1–2px, neon green at low opacity) are permitted only as intentional structural devices anchored to the page margin.

**Page types:** The website distinguishes two canvas modes:
- **Solution pages** — dark green body background (`colors.primary`). Modules render dark-on-dark with accent highlights.
- **Case / Work pages** — white body background (`colors.surface`). Individual modules may be dark via the module-theme system, bleeding full-width into the layout with a clip-path technique.

**Module theme system:** Each content module carries a `data-theme` attribute (`dark` or `light`) that determines its background and text color independently of the page type. A `module-theme` SCSS mixin applies the correct surface token and ensures the background extends full-bleed, including into the sidebar indicator column. A −1px vertical overlap prevents sub-pixel seams between adjacent modules.

**Header:** Three-column grid layout: navigation links (left) / wordmark logo (center) / CTA (right). Logo dimensions: 180×55px on desktop, 112×34px on mobile. The navigation overlay uses a full-screen dark-green canvas with featured solutions and a decorative "giraffe" illustration.

**Sidebar page indicator:** Pages include a narrow left column that renders a scroll-position indicator. The indicator column inherits its theme (`dark`/`light`) from the adjacent module via the `data-indicator-theme` attribute.

**Responsive behavior:** The 57px page margin collapses to `clamp(24px, 4vw, 57px)`. The 12-column grid collapses: 3 desktop columns → 9 mobile columns for card grids (Swiper-based). Slider `spaceBetween` is 24px.

## Elevation & Depth
Completely flat. No shadows, no blur effects, no gradients. Depth is achieved through:
- **Tonal contrast:** The stark opposition of the deep forest green against either white or electric green creates instant visual layering without physical shadow.
- **Scale contrast:** Oversized decorative type at 350–545px sits behind or beside smaller reading text; size alone suggests foreground/background relationship.
- **Color role:** The neon accent reads as an energetic foreground element regardless of z-position because of its extreme saturation contrast against the dark ground.

Do not add box shadows, drop shadows, inner glows, textures, grain, noise overlays, or film effects of any kind. The surface is a pure, flat color field — no atmospheric embellishment.

## Shapes
All edges are sharp. Border radius: 0px across all elements — slides, photo placeholders, containers, text boxes. No pills, no rounded cards, no softened corners. The geometry is strictly rectilinear, reflecting the precise, engineered confidence of the JvM brand identity.

Photo placeholders (team card headshots) are square or portrait rectangles with zero rounding.

## Do's and Don'ts
- Do respect the DESIGN.md specification here and stick to the tokens
- Do use our logo and other image resources in `./assets`
- Do Use our fonts which live in `./fonts`
- Do use `assets/logo.svg` for every brand representation — it is the sole valid form of the brand mark. In HTML, use an `<img>` tag or inline the SVG. Never use a text node, span, or any character sequence to represent the wordmark.
- Do refer to the company as "Jung von Matt" — no ampersand, no abbreviation, no punctuation.
- Do use Carloschi Headline Black exclusively for headlines and decorative display text.
- Do keep all text uppercase in headline and label roles.
- Do apply Electric Neon Green (`#00eb73`) to decorative wordmarks, primary CTA buttons, and key accent moments.
- Do use the `data-theme` attribute (`dark`/`light`) on every content module to declare its surface mode independently of the page background.
- Do maintain sharp, zero-radius geometry for all containers, cards, inputs, and buttons.
- Do use background color contrast and whitespace as the sole means of visual separation between sections and content groups.
- Don't typeset the brand name in any font — the SVG logo asset is the only valid representation. Do not approximate the logo with letters or styled spans.
- Don't apply any letter-spacing to Carloschi Headline / display weight — neither positive nor negative. The condensed letterforms are designed to run at 0 tracking.
- Don't add shadows, gradients, transparency effects, textures, grain, noise overlays, or film effects. The system is intentionally flat and clean.
- Don't introduce additional typefaces. Carloschi is the sole typeface family across all weights and roles.
- Don't use horizontal rules, borders, or divider lines as decorative separators — not between form fields, not between sections, not in footers.
- Don't use the accent neon green as a large fill area or page background. It is an accent and action color only.
- Don't mix dark-theme and light-theme elements on the same surface without a `module-theme` mixin boundary.
- Don't scale the display wordmark below a size that creates visual tension against body text — if it fits comfortably alongside copy, it is too small.
- Don't introduce colors from outside the defined palette for decorative purposes.
