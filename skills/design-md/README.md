# design-md

Reverse-engineers a design system from any source — Figma file, live website, screenshot, or existing tokens — and produces a spec-compliant `DESIGN.md` with 3-tier tokens (Primitive → Semantic → Component). Follows the [DESIGN.md spec](https://github.com/google-labs-code/design.md).

Replaces the previous `figma-design-md` skill with a unified, source-agnostic approach.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/design-md --global
```

## Usage

Point the agent at any design source:

```text
Generate a DESIGN.md from figma.com/design/abc123/My-App
```

```text
Create a DESIGN.md from https://example.com
```

```text
Extract a design system from this screenshot
```

```text
Refine the existing DESIGN.md with updated colors
```

The agent will:

1. Detect the source type (Figma, website, screenshot, tokens, existing DESIGN.md).
2. Extract design tokens using the appropriate tool (Figma MCP, chrome-devtools MCP, visual analysis).
3. Organize tokens into three tiers: Primitive (raw hex) → Semantic (functional roles) → Component (UI atoms).
4. Write a spec-compliant DESIGN.md with evocative prose.
5. Validate with `npx @google/design.md lint`.
6. Ensure adoption: register in agent config, export tokens to framework format, embed a design guard.

## Output

```text
design-md/
├── SKILL.md                       — Agent instructions & workflow
├── references/
│   └── output-template.md         — DESIGN.md structure and token schema
└── README.md                      — This file
```

## Supported sources

| Source | Tool | Precision |
|---|---|---|
| Figma URL | Figma MCP | Exact — tokens from design tool |
| Live website | chrome-devtools MCP | Exact — computed styles |
| Screenshot / image | Visual analysis | Approximate — flagged in output |
| CSS / Tailwind / tokens.json | Direct parse | Exact — mapped to schema |
| Existing DESIGN.md | Diff and merge | N/A — refinement mode |

## Relationship to other skills

- `jvm-design` — bootstraps the JvM-specific CI 2026 design system (brand assets, fonts). Stays separate.
- `design-md` — generic, source-agnostic design system extraction. This skill.
