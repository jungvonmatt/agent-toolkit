# Agent Toolkit

Reusable agent skills, rules, prompts, and workflows for AI-assisted development as used at Jung von Matt TECH.

## Quick Start

Install all skills with the [skills CLI](https://github.com/vercel-labs/skills) — works with Claude Code, Cursor, Copilot, Codex, Cline, and more:

```bash
npx skills add jungvonmatt/agent-toolkit              # install all skills
npx skills add jungvonmatt/agent-toolkit --list        # browse before installing
```

Or grab individual skills:

```bash
npx skills add jungvonmatt/agent-toolkit --skill start-ticket
npx skills add jungvonmatt/agent-toolkit --skill pr-description
npx skills add jungvonmatt/agent-toolkit --skill pr-review
```

All skills are namespaced under `jvm-skills` to avoid conflicts with other skill packs.

> **Manual install:** Clone the repo and run `./sync-skills.sh` to copy skills into `~/.agents/skills/`.

### Native Plugin Install

Install via the plugin marketplaces if your team does not use Node/npm locally.

#### Claude Code

```bash
claude plugin marketplace add jungvonmatt/agent-toolkit
claude plugin install jvm-skills@jvm-skills
```

If your environment has no GitHub SSH keys, force HTTPS cloning:

```bash
export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1
claude plugin marketplace add jungvonmatt/agent-toolkit
claude plugin install jvm-skills@jvm-skills
```

#### Codex CLI

```bash
codex plugin marketplace add jungvonmatt/agent-toolkit
codex plugin add jvm-skills@jvm-skills
```

## Skills

| Skill | Description |
| --- | --- |
| `write-ticket` | Turns a raw idea, bug report, or feature request into a development-ready ticket — acts as a product coach that finds weak spots, refines requirements with the author, and publishes directly to Jira, GitHub, GitLab, Linear, or Asana. |
| `start-ticket` | Turns a ticket (Jira, Asana, Linear, GitHub/GitLab Issues) into a ready-to-execute implementation plan — fetches the ticket, pulls design specs, explores the codebase, pressure-tests the requirement, and writes a plan. |
| `pr-description` | Generates a concise PR/MR description in Simplified Technical English from the current branch diff — auto-captures screenshots when UI changes are detected. |
| `pr-review` | Comprehensive pull request review against a configurable target branch with severity-ranked findings, Jira traceability, accessibility checks, and performance analysis. |
| `repo-diagnostics` | Git-based diagnostics that reveal churn hotspots, bus factor, bug clustering, commit velocity, and crisis patterns — before reading any code. |
| `jvm-design` | Bootstraps a project with the Jung von Matt CI 2026 design system by copying `DESIGN.md`, brand assets, and fonts into the project root. |
| `design-md` | Reverse-engineers a design system from any source (Figma, live website, screenshot, or tokens) into a spec-compliant `DESIGN.md` with tiered tokens. |

### Commands (Claude Code)

| Command | Description |
| --- | --- |
| `/jvm-skills:write-ticket` | Turn a raw idea into a development-ready ticket |
| `/jvm-skills:start-ticket` | Fetch a ticket and produce a ready-to-execute plan |
| `/jvm-skills:pr-description` | Generate a PR/MR description from the current branch |
| `/jvm-skills:review` | Review the current PR/MR for merge readiness |
| `/jvm-skills:repo-diagnostics` | Run git-based repository diagnostics |
| `/jvm-skills:design` | Bootstrap the JvM CI 2026 design system into a project |
| `/jvm-skills:design-md` | Reverse-engineer a DESIGN.md from any design source |

### Companion Skills

Some skills route to companion skills from external sources. They degrade gracefully — they still work without them, loading only the companions present in the workspace.

```bash
# General-purpose skills (planning, spec-driven-development, security, performance …)
npx skills add addyosmani/agent-skills

# Chrome DevTools skills (a11y-debugging, network, performance traces …)
npx skills add ChromeDevTools/chrome-devtools-mcp

# Web performance skills (Core Web Vitals, loading, interaction, media …)
npx skills add nucliweb/webperf-snippets
```

> **`start-ticket`** routes to `planning-and-task-breakdown`, and conditionally to `spec-driven-development`, `doubt-driven-development`, `interview-me`, `security-and-hardening`, and `performance-optimization` from `addyosmani/agent-skills`.

## Recommended Third-Party Sources

We don't try to cover everything ourselves. These are the skill packs and MCP servers we rely on across our projects — though not every project uses all of them. We pick what fits the stack and the task. Some of our skills reference companions from these packs but work fine without them.

### Skills

| Repository | Description | Classification |
| --- | --- | --- |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Full-lifecycle engineering skills from spec to ship. | Engineering |
| [mattpocock/skills](https://github.com/mattpocock/skills) | Alignment-first workflow with grilling, domain modeling, and TDD. | Engineering |
| [obra/superpowers](https://github.com/obra/superpowers) | Development methodology with subagent orchestration and git worktrees. | Methodology |
| [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) | Modern web platform features and best practices by the Chrome and Edge teams. | Web Platform |
| [nucliweb/webperf-snippets](https://github.com/nucliweb/webperf-snippets) | DevTools snippets for measuring and debugging Core Web Vitals. | Performance |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React/Next.js performance, Vercel deployment, and the `npx skills` CLI. | React, Vercel |
| [antfu/skills](https://github.com/antfu/skills) | Auto-generated skills for the Vue/Vite ecosystem. | Vue, Tooling |

### MCP Servers

| Server | Repository | Description |
| --- | --- | --- |
| Chrome DevTools | [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Browser automation, performance traces, Lighthouse audits, and screenshots. |
| Atlassian | [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | Jira and Confluence access for Cloud and Server/Data Center. |
| GitHub | [github/github-mcp-server](https://github.com/github/github-mcp-server) | Official GitHub MCP server for repos, issues, PRs, and code search. |
| Figma | [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) | Figma design data and image downloads for one-shot implementation. |
| Context7 | [upstash/context7](https://github.com/upstash/context7) | Up-to-date, version-specific library documentation as context for coding agents. |

## Contributing

Contributions welcome! See [Contributing Guide](CONTRIBUTING.md) for guidelines.
