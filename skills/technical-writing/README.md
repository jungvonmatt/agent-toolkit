# technical-writing

Writes technical prose that a busy reader can act on: code comments, doc
comments, documentation, and technical blog posts. Kicks in automatically
whenever you write or edit a comment, a JSDoc/TSDoc/KDoc/Javadoc block, a
docstring, a README, a guide, a changelog, a runbook, or a blog post.

Core rules for every branch:

1. **Lead with the point** — the first sentence carries the message.
2. **One idea per sentence** — at most 20 words in an instruction, 25 in a description.
3. **Active voice, present tense, "you"** — imperative for instructions.
4. **One term per concept** — the exact name from the code, never a synonym for variety.
5. **Derive, never invent** — every name, flag, and number traces to the code or a command that ran.

Every draft then goes through the **cut test** (delete each sentence the reader
does not need), a sweep for AI-writing tells, and a fact check.

Per branch:

- **Code comments** follow clean-code rules: comment the *why*, a constraint, or
  the contract, never the *what*. One-line inline comments. Doc comments state
  only what the signature cannot. No change-log comments, no echo tags, no types
  in JSDoc inside TypeScript.
- **Documentation** picks one [Diátaxis](https://diataxis.fr/) mode per page
  (tutorial, how-to, reference, explanation) and writes the prose in
  Simplified Technical English (ASD-STE100), adapted for software.
- **Blog posts** teach one idea through one real case, with real code, real
  numbers, dead ends, and trade-offs.

Agent-facing documents (skills, `AGENTS.md`, `CLAUDE.md`) are out of scope: use
`writing-for-agents` from [mattpocock/skills](https://github.com/mattpocock/skills).

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/technical-writing --global
```

## Usage

The skill applies automatically while you write docs or comments. You can also
invoke it:

```text
Add JSDoc to the exported functions in this file
```

```text
Write a README for this package
```

```text
Clean up the comments in this module
```

```text
Draft a blog post about how we migrated to Pinia
```

## Reference

- [`references/code-comments.md`](references/code-comments.md) — when to comment, inline and doc comment rules, per-language conventions, over-commenting patterns.
- [`references/documentation.md`](references/documentation.md) — Diátaxis modes, procedures, code samples, README, reference, runbook, changelog, and ADR rules.
- [`references/simplified-technical-english.md`](references/simplified-technical-english.md) — ASD-STE100 rules adapted for software documentation.
- [`references/blog-posts.md`](references/blog-posts.md) — structure and rules for engineering blog posts.
