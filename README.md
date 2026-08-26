# Agent Toolkit

Reusable Agent skills, rules prompts, and workflows for AI-assisted development as used at Jung von Matt TECH.

> **Tip**: View this README with `⌘+Shift+V` in Agent/VSC for better formatting.

## Quick Start

```bash
# Clone into your project or a central location
git clone https://github.com/jungvonmatt/agent-toolkit.git
# Copy full dir or cherry pick into your target repo or home dir .agents
cp -r ${PATH_TO_TOOLKIT}/* .agents
```

**What's included:**

- Agent Rules: Development standards and AI guidance
- Prompts: Story creation, commit messages, PR descriptions
- MCP Servers: Optional tools for extended AI capabilities
- Workflows: Agent documentation on using Git and story-based development

## Skills

Skills are reusable agent workflows packaged as `SKILL.md` files. Install them into your project using:

```bash
npx skills@latest add jungvonmatt/agent-toolkit
```

| Skill              | Description                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `start-ticket`     | Turns a ticket (Jira, Asana, Linear, GitHub/GitLab Issues) into a ready-to-execute implementation plan — fetches the ticket, pulls design specs, explores the codebase, pressure-tests the requirement, and writes a plan in Simplified Technical English. |
| `pr-review`        | Comprehensive pull request review against a configurable target branch with severity-ranked findings, Jira traceability, accessibility checks, and performance analysis. |
| `repo-diagnostics` | Git-based diagnostics that reveal churn hotspots, bus factor, bug clustering, commit velocity, and crisis patterns — before reading any code.                            |
| `jvm-design`       | Bootstraps a project with the Jung von Matt CI 2026 design system by copying `DESIGN.md`, brand assets, and fonts into the project root.                                 |
| `design-md`        | Analyzes a Figma project URL and synthesizes the design language into a semantic `DESIGN.md` file.                                                                       |

Some skills in this toolkit depend on companion skills from external sources. Install them as needed:

```bash
# General-purpose agent skills (planning-and-task-breakdown, spec-driven-development,
# doubt-driven-development, security-and-hardening, performance-optimization …)
npx skills@latest add addyosmani/agent-skills

# Chrome DevTools skills (a11y-debugging, network, performance traces, …)
npx skills@latest add ChromeDevTools/chrome-devtools-mcp

# Web performance skills (Core Web Vitals, loading, interaction, media, …)
npx skills@latest add nucliweb/webperf-snippets
```

> **`start-ticket` depends on `addyosmani/agent-skills`.** It routes to `planning-and-task-breakdown` (plan output), and conditionally to `spec-driven-development`, `doubt-driven-development`, `interview-me`, `security-and-hardening`, and `performance-optimization`. Install `addyosmani/agent-skills` for the full workflow. The skill degrades gracefully — it still runs without them, loading only the companions present in the workspace. Its own `references/` (including a self-contained `definition-of-done.md`) ship inside the skill folder, so no shared `references/` install is required.

> **Chrome DevTools MCP** — the Chrome DevTools skills require the MCP server to be running. See the [setup guide](https://github.com/ChromeDevTools/chrome-devtools-mcp) for installation instructions.

## Contributing

Contributions welcome! See [Contributing Guide](docs/CONTRIBUTING.md) for guidelines.

## Credits

Some of the recipes and prompts in this toolkit are inspired by or adapted from [Context7](https://context7.com) and [Playbooks](https://playbooks.com).
