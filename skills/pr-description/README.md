# pr-description

Generates a pull/merge request description from the current branch diff. Writes concise, human-readable Markdown in Simplified Technical English (ASD-STE100) — no AI slop, no filler prose.

The description tells a reviewer three things before they open the diff:

- **Shape** — one optional small visual of the change (call tree, component tree, file tree, Mermaid, or a `diff` sketch).
- **Evidence** — before/after proof: existing screenshots, a test that now passes, CI results. A missing proof is stated as missing.
- **Merge Danger** — whether a revert fully undoes the change (one-way or two-way door), and the blast radius.

Adds a screenshot placeholder when UI changes are detected and no screenshots exist, so the author can paste before/after images. Adds a checklist only when the project's PR/MR template has one.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/pr-description --global
```

## Usage

Run on any branch with uncommitted or committed changes:

```text
Generate a PR description
```

```text
Write a PR description for this branch
```

```text
PR description with screenshots
```

The agent will:

1. Analyse the diff, commits, and branch name.
2. Detect and fetch linked ticket context (Jira, GitHub Issues, GitLab Issues, Linear).
3. Use the project's PR/MR template and domain glossary if they exist, otherwise fall back to the default.
4. Pick the smallest visual that shows the shape of the change, or skip it.
5. Collect existing evidence: tests in the diff, CI checks, the `implement` review packet, screenshots.
6. Assess merge danger from diff signals (migrations, public API, persisted state, URLs, side effects).
7. Output copy-ready Markdown in a fenced code block.

## Output

```text
pr-description/
├── SKILL.md                  — Agent instructions & workflow
├── references/
│   └── output-template.md    — Description structure and formatting rules
└── README.md                 — This file
```

## Relationship to pr-review

`pr-description` produces the PR description before opening the PR.
`pr-review` reviews the PR after it is opened.

They form a pipeline: **implementation → pr-description → pr-review → merge**. `pr-review` treats the stated Merge Danger as a claim and verifies it against the diff.

## Credits

The Shape, Evidence, and Merge Danger sections are adapted from Matt Pocock's [`pr`](https://github.com/mattpocock/skills) skill, whose menu of visuals comes from Dex Horthy's [`show-me`](https://github.com/humanlayer/skills) skill.
