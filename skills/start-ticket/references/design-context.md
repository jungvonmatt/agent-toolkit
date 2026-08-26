# Design Context

Read only when the ticket links a design source. Skip for non-visual tickets.

## Figma (via MCP)

Don't stop at the top-level frame — drill into child nodes to capture every state and variant.

1. `get_metadata` on the node → layer tree (IDs, names, structure).
2. `get_design_context` on the top-level node → overview, reference code, screenshot.
3. Identify child nodes for individual states/variants ("Default", "Hover", "Focus", "Selected", "Disabled", "Error") or spec sections ("Anatomy", "Spacing", "Variants").
4. `get_design_context` on each relevant child → styles, spacing, typography, colors per state.
5. `get_variable_defs` on key nodes → map Figma variables to project design tokens.

## Screenshots / static designs

When only images are provided, extract the same information by inspection: states, layout variants, spacing, typography, colors, and structure. Flag anything ambiguous as a clarifying question in Step 6.

## What to extract

- **All interactive states** — default, hover, focus, active, selected, disabled/unavailable, error.
- **Layout variants** — sizes, compact vs. default, responsive breakpoints.
- **Spacing & padding** — exact values, tap-target sizes.
- **Typography** — family, size, weight → map to project tokens.
- **Colors** — map to project tokens.
- **Accessibility specs** — contrast ratios, keyboard rules, ARIA notes.
- **Anatomy** — component structure (container, label, icon, …).

## Token mapping (mandatory when the project has a token system)

Every color, spacing, font-size, and shadow **must** map to an existing project token (from the theme/token source detected in Step 2). If no token matches:

1. Add a new token following the project's naming conventions.
2. Use the token — never arbitrary values (e.g. no `text-[#b3b3b3]`).
3. List new tokens as a prerequisite task in the plan.

Consolidate findings into a design-spec summary that feeds the plan's decisions table and task descriptions.
