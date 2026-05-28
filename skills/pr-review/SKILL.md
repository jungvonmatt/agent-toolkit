---
name: pr-review
description: Comprehensive pull request review for the current branch against a configurable target branch with severity-ranked findings, Jira requirement traceability, conditional accessibility checks, and deep performance analysis. Use when validating merge readiness, auditing regressions, preparing actionable review feedback, or checking implementation quality without changing code.
---

# PR Review Against Target Branch

Perform a deep review of the current branch against a target branch (e.g. `main`, `develop`, `integration`, `release/*`).
Keep the review read-only: do not modify code.

## Workflow

### 1. Establish the review baseline

- Confirm the active branch and determine the diff target (the "target branch").
- If the user did not pass a target branch in the prompt, ask first before doing anything else:
  `Which target branch should I review against? (e.g. main, develop, integration)`
- Only after the user has answered (or explicitly provided one in the prompt), continue.
- As a convenience, you may suggest a default in the question based on:
  1. Repository default branch via `git symbolic-ref refs/remotes/origin/HEAD` (strip `refs/remotes/origin/`).
  2. First match from common candidates that exists locally or on `origin`: `main`, `master`, `develop`, `integration`, `trunk`.
- Prefer merge-base comparison (`<target>...HEAD`) to review only branch-introduced changes.
- Use these baseline commands (replace `<target>` with the resolved branch):

```bash
git rev-parse --abbrev-ref HEAD
git fetch origin <target>
git diff --name-status <target>...HEAD
git diff --stat <target>...HEAD
git diff <target>...HEAD
pnpx fallow audit --base <target> --format json --quiet --explain
```

- If `git fetch` fails, fall back to the local ref `<target>` and report that limitation.
- If neither remote nor local ref exists, stop and report the missing target branch.
- **Fallow is required.** It is published to npm and resolves automatically via `pnpx`, so don't pre-check whether it's installed — just invoke it. Only treat it as unavailable if the `pnpx fallow` call itself errors out (e.g. offline), and in that case still complete the rest of the review and note the gap.
- **Read fallow's attribution block**, not just the raw counts. The summary distinguishes `*_introduced` (caused by this branch — must be reported) from `*_inherited` (pre-existing — note only if directly relevant to the diff). Cite the JSON `verdict` and any introduced findings explicitly in the report. Fallow's reachability graph treats every Vue SFC under `app/components/` as a plugin entry point, so orphan `.vue` files won't appear in `unused_files` — fall back to `grep` across `.vue` / `.ts` / `.stories.ts` to verify component reachability when a file looks abandoned.

### 2. Ask for missing context

- Ask once at the beginning:
  `Is there a Jira ticket for this change? If yes, please share the key or link.`
- Ask for a runtime URL only if browser checks are needed and the default is not valid:
  `Should I use https://localhost:3000 or is there a different local setup?`

### 3. Load companion skills

Use all relevant skills that are available in the environment.

- Always use (if available): `code-review-and-quality`, `best-practices`, `performance` or `performance-optimization`.
- Always run the `pnpx fallow audit` step from §1 — it is a CLI tool, not a skill, and must not be listed under **⚠ Missing Skills**.
- Use for runtime/browser validation (if available): `chrome-devtools` or `browser-testing-with-devtools`.
- Use conditionally: `a11y-debugging` only when UI, markup, interaction, or form changes are present in the diff.
- Read [`references/review-checklist.md`](references/review-checklist.md) for detailed criteria.

**Mandatory skill-discovery checklist (do not skip).** Before continuing to §4, scan the session-start system reminder for the available-skills list and the deferred-tool list. Print a table with one row per candidate skill from the list above, marking each as `Available + Invoked`, `Available + Skipped (reason)`, or `Not available`. A skill counts as "Available" if either (a) its name appears in the available-skills system reminder, or (b) its corresponding MCP tools (e.g. `mcp__chrome-devtools__*`, `mcp__playwright__*`) appear in the deferred-tool list. **If a skill is Available, the default is to invoke it** — do not move past §3 until each Available skill is either invoked or has an explicit, written reason for being skipped. The "Skipped" reason must not be "findings are statically determinable" — that is the wrong default for a review.

Example checkpoint output:

| Candidate skill | Status | Notes |
|---|---|---|
| `code-review-and-quality` | Available + Invoked | — |
| `chrome-devtools` | Available + Invoked | Runtime check planned for §5 |
| `a11y-debugging` | Available + Skipped | No UI/markup changes in diff |
| `best-practices` | Not available | Install: `npx skills@latest add addyosmani/agent-skills` |

### 4. Execute the review

- Prioritize findings that can cause regressions, broken behavior, security issues, or poor user experience.
- Put special focus on performance risks.
- Check test quality and missing test coverage for changed behavior.
- If a Jira ticket exists, map implementation against each requirement and flag mismatches.

#### Verification discipline (non-negotiable)

A review's value lives entirely in the gap between "looks correct" and "proven correct." The most damaging misses come from closing that gap with a confident assumption instead of a cheap check. Before you assert **or dismiss** any finding, run the check — never the assumption.

**Red-flag thoughts → required action.** If you catch yourself thinking the left column, you are rationalizing. Do the right column before proceeding.

| Thought | Required action |
|---|---|
| "The error handling looks fine." | "Looks fine" ≠ verified. For every external/dependency call inside an error path, open the callee's signature or source and confirm its **failure mode**. An awaited call does **not** guarantee rejection — many helpers (incl. SCAYLE `@scayle/*`) catch internally and resolve a sentinel (`{}`, `null`, or a `{ [key]: false }` map) instead of throwing. Trace the failure across the seam before calling the handling correct. |
| "This static-analysis finding is probably a false positive." | Disprove it with one `grep`/read before dismissing. The tool already read the code; the burden is on **you** to prove it wrong, not to wave it away. (Unused-export finding → grep the symbol and check whether consumers use the **named** vs the **default** export — they are different symbols.) |
| "That duplication / dead code is probably just tests or fixtures." | Don't attribute — locate. Open the tool's `file:line` pairs and read both sites before assigning severity. An unverified attribution is a guess wearing a finding's clothes. |
| "I'll trust our code here and move on." | Skepticism is directional. Be **most** suspicious of our own code at integration seams (calls into libraries, RPCs, the dependency boundary) and **respect** static-tool findings inside their wheelhouse (unused exports, duplication, reachability). The classic failure is doing the reverse — credulous toward our code, dismissive toward the tool. |

**Boundary-contract rule.** For each external call introduced or relied on in the diff — especially inside `try/catch`, `.then/.catch`, or any success/failure branch — write down what the callee returns *on failure* and confirm the caller handles that exact mode. Never infer the contract from the function's name.

**Evidence hygiene.** Never `| tail`, `| head`, or otherwise truncate tool output you intend to reason from (fallow JSON, test results, type errors). Truncation silently drops the verdict/attribution block and invites narrative backfill. Pipe to a file and read the full verdict, or read it in full.

**No narrative substitution.** When you cannot verify a claim, the output is the literal word **"unverified"** in the report — never a plausible-sounding attribution presented as fact. "Probably X" is not a finding.

### 5. Run runtime checks

**Runtime checks are MANDATORY when the diff touches any UI surface** — `.vue`, `.tsx`, `.jsx`, `.css`, `.scss`, `.html`, layout files, route components, middleware affecting rendered pages, or i18n keys consumed by templates. "The gap is statically determinable" is **not** a valid reason to skip runtime — running the app may surface regressions, console errors, network failures, or accessibility issues that static review cannot.

Runtime checks are optional only when the diff is purely:
- Server-only code (`server/`, `rpcMethods/`, build config)
- Tests, fixtures, mocks, stories
- Pure utility/type files with no UI consumer in the diff
- Documentation / config / dependency bumps with no runtime impact

When mandatory:
1. Start the app (or confirm it is reachable). Default: `https://localhost:3000`.
2. Use `chrome-devtools` MCP tools (or `browser-testing-with-devtools`) to: (a) navigate to each affected page/route, (b) take a DOM snapshot, (c) interact with new UI affordances introduced by the diff, (d) read console messages, (e) inspect network requests if the diff touches data fetching.
3. If `a11y-debugging` is available and UI/markup changed, run an accessibility audit on the affected page(s).
4. Quote concrete runtime evidence (console output, screenshot, snapshot excerpt) in any P0/P1 finding that depends on runtime behavior.
5. If the app cannot be started or reached, explicitly state which runtime checks were skipped and why, and flag it as a coverage gap in the report.

**Verification checkpoint — required before §6.** Print a one-line status for each prior step before writing the report:

- §1 Baseline established: ✅ / ❌ (note: target branch, fallow verdict)
- §2 Jira ticket: ✅ provided / ⚠ none / ❌ requested but unavailable
- §3 Skill discovery checklist completed: ✅ / ❌
- §3 Available skills invoked: list invoked / list deferred-with-reason
- §5 Runtime checks: ✅ ran (list pages + tools used) / ⚠ skipped (reason from gate above) / ❌ blocked (reason)

Do not proceed to §6 until each line is resolved. If §3 or §5 has a ❌, fix the gap first instead of writing the report.

### 6. Report findings clearly

- Follow [`references/reporting-template.md`](references/reporting-template.md).
- Order findings by severity (`P0` to `P3`).
- For each finding, include:
  - precise evidence (file and line)
  - impact and risk
  - concise recommendation
  - short example when useful
- If no major issues are found, state that explicitly and still list residual risks or test gaps.
- If any companion skills were unavailable, append a **⚠ Missing Skills** section at the end of the report. For each missing skill, state which review aspect was skipped and provide the install command for its source repository:

  | Source                               | Install                                                    |
  | ------------------------------------ | ---------------------------------------------------------- |
  | `addyosmani/agent-skills`            | `npx skills@latest add addyosmani/agent-skills`            |
  | `ChromeDevTools/chrome-devtools-mcp` | `npx skills@latest add ChromeDevTools/chrome-devtools-mcp` |
  | `nucliweb/webperf-snippets`          | `npx skills@latest add nucliweb/webperf-snippets`          |

  Example:

  > **⚠ Missing Skills**
  >
  > The following skills were not available. The listed review aspects were skipped or performed with reduced depth.
  >
  > | Skill            | Source                               | Skipped aspect                                   | Install                                                    |
  > | ---------------- | ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------- |
  > | `best-practices` | `addyosmani/agent-skills`            | Security, compatibility, and code-quality checks | `npx skills@latest add addyosmani/agent-skills`            |
  > | `a11y-debugging` | `ChromeDevTools/chrome-devtools-mcp` | Accessibility audit                              | `npx skills@latest add ChromeDevTools/chrome-devtools-mcp` |

## Guardrails

- Do not make any code changes.
- Do not use destructive git commands.
- Do not claim checks that were not run.
- Do not skip Jira alignment when a ticket is provided.
- Do not present an unverified assumption as a finding **or** as a dismissal. Run the `grep`/read/contract check first (see §4 Verification discipline). A dismissed true-positive is as costly as a missed bug.
- A skill counts as "missing" only when its name is absent from the available-skills system reminder AND its MCP tools (if any) are absent from the deferred-tool list. An available skill that you simply chose not to invoke is **not** missing — it is a skipped check and must be reported under "Verification checkpoint" with an explicit reason, not under "⚠ Missing Skills."
