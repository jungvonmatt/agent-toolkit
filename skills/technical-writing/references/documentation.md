# Documentation

Rules for READMEs, tutorials, how-to guides, reference, explanation, runbooks, changelogs, and ADRs. Write the prose in Simplified Technical English: [`simplified-technical-english.md`](simplified-technical-english.md).

## Pick one mode

Every page serves one of four reader needs ([Diátaxis](https://diataxis.fr/)). Find the mode with two questions: does the reader want to **do** or to **know**, and are they **learning** or **working**?

| Mode | Reader | Contains | Leaves out |
|---|---|---|---|
| **Tutorial** (do + learn) | A beginner who learns by doing | The end result, shown first. One tested happy path. A visible result after every step. | Choices, alternatives, and theory. Link to them. |
| **How-to guide** (do + work) | A competent user with a real goal | A "How to …" title, prerequisites, numbered steps, a check that it worked. | Teaching and background. Every option (link to the reference). |
| **Reference** (know + work) | A user who looks up one fact | A structure that mirrors the code or API. The same fields for every entry. Complete coverage. | Instructions, opinions, and the reasons behind the design. |
| **Explanation** (know + learn) | A reader who wants the why | Context, constraints, design decisions, alternatives, trade-offs. | Steps and reference detail. |

One page has one mode. When a request spans modes, write one page per mode and link them. A tutorial that stops to explain, or a reference that starts to teach, fails both readers.

## Every page

- **Stand alone.** Assume the reader arrived from a search. The first paragraph states what the page covers, who it is for, and the prerequisites. Link to other pages instead of repeating them.
- **Headings:** sentence case, one H1, no skipped levels. Start a task heading with a verb ("Configure the cache"). Put the keyword first. Keep code and links out of headings. Put text under every heading before the next one.
- **Paragraphs** open with their topic sentence. A reader who reads only the headings and first sentences gets the whole page.
- **Lists** follow an intro sentence that ends with a colon. Items are parallel in grammar and punctuation. A table cell holds at most two sentences.
- **Link text** names the target: "see Configure the cache", not "click here". Use relative links inside a repository.
- **Notes and warnings** follow the rules in [`simplified-technical-english.md`](simplified-technical-english.md#notes-and-warnings).
- **Accuracy beats coverage.** Wrong docs are worse than no docs. When you change behavior, update every page that describes it in the same change: search the docs for the old name, flag, or value.

## Procedures

1. List the prerequisites before step 1: versions, access, and what must already run.
2. Number the steps. Write one action per step, and start it with an imperative verb or with a location and then the verb ("In **Settings**, select **Tokens**"). Two actions share a step only when they happen at the same time. A menu path (**File** > **New**) is one action.
3. Put a condition or a goal before its action, followed by a comma: "If you use pnpm, run `pnpm install`."
4. State the result after the action when the reader must see it: "The server starts on port 3000."
5. Mark an optional step with "Optional:".
6. After an error-prone step, say what failure looks like and how to recover.
7. End with a step that verifies success.

## Code samples

- Run every sample, or check it line by line against the source.
- Make it copy-pasteable: no `$` prompt, no line numbers, no output in the same block. Show the expected output in its own block.
- Tag each fence with its language. Name the file above a snippet that belongs in a file.
- Use long flags in commands: `--force`, not `-f`.
- Write placeholders as `<API_KEY>` and explain each one below the block.
- Start with the minimal working example. Add options after it.

## Types

### README

The front door of a project: what it is, why it exists, how to start. In this order:

1. Name and a one-line description (under 120 characters).
2. What it does and why a reader wants it, in one short paragraph.
3. Install, as a code block.
4. A minimal usage example with its output.
5. Configuration, when there is any.
6. Where to get help, how to contribute, and the license (last).

Link to the full docs instead of growing the README into a manual. Add a table of contents above 100 lines.

### Reference

Give every entry the same fields, in the same order: signature or endpoint, purpose in one sentence, parameters (name, type, default, required, meaning), return value, errors, and one example request with its response. Generate reference from the code (TypeDoc, OpenAPI, Dokka) when the project supports it, and write the doc comments by [`code-comments.md`](code-comments.md).

### Explanation and architecture

Bound the topic ("About the cache layer"). Describe the context, the constraints, the decision, the alternatives, and the trade-offs. A diagram helps when components interact. Keep steps out, and link to the how-to guide instead.

### Runbook

One runbook per alert or incident type. The on-call reader is under stress, so give commands, not essays:

1. **Trigger:** the alert name and what the reader sees.
2. **Impact:** who is affected and how badly.
3. **Diagnose:** numbered checks, each with a copy-paste command and the output that means "this is the cause".
4. **Mitigate:** the commands that stop the damage, safest first.
5. **Escalate:** who to contact and when.
6. **Verify:** the signal that shows the incident is over.

### Changelog

Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/): `CHANGELOG.md`, newest version first, an `## [Unreleased]` section at the top, and versions as `## [1.4.0] - 2026-09-28`. Group entries under Added, Changed, Deprecated, Removed, Fixed, and Security. Each entry states the change a user sees and links the PR or issue. Put breaking changes first in their section and give the migration step. A changelog is not a git log: leave out refactors, CI changes, and dependency bumps that change nothing for the user.

### ADR

Follow the project's ADR template when one exists, else the ADR template of the `start-ticket` skill when it is installed. Otherwise extend [Michael Nygard's format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

- **Header:** a title that states the decision as a claim, then Status (Proposed, Accepted, Deprecated, Superseded by ADR-NNNN), Date, and a link to the ticket or PR. The number goes in the filename, such as `docs/adr/0007-page-the-export-api.md`.
- **Body:** Context (the facts and constraints, stated neutrally), Decision, Consequences (the costs too), and Rejected alternatives (each with the constraint that ruled it out).
- **Sentences:** the system is the subject, not "we". Back each rationale with a constraint the reader can check: a repository fact, an API contract, or a dated measurement.

A one-paragraph ADR is valid. Supersede an accepted ADR with a new one; never edit it.

## Checklist

- [ ] The page has one Diátaxis mode, and its title and first paragraph say what it covers and for whom.
- [ ] Every procedure step holds one action, starts with a verb, and the last step verifies success.
- [ ] Every command and code sample ran, or matches the source line by line.
- [ ] Every name, path, flag, and default matches the code.
- [ ] Every page that describes the changed behavior is updated.
- [ ] The prose passes the checks in [`simplified-technical-english.md`](simplified-technical-english.md).
