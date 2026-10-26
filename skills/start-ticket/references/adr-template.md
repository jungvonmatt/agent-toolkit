# ADR Template

An ADR records **that** a decision was made and **why**. It is not a feature description: the
code, the tests, and the ticket already record what the system does. A future reader opens
an ADR when the code surprises them, so the ADR answers "why on earth is it done this way?"
and nothing else.

## When to write one

Offer an ADR only when all three are true:

1. **Hard to reverse.** Changing your mind later has a real cost.
2. **Surprising without context.** A future reader looks at the code and wonders why.
3. **The result of a real trade-off.** There were genuine alternatives, and one was picked for specific reasons.

If a decision is easy to reverse, skip it: you will just reverse it. If it is not
surprising, nobody will ask. If there was no real alternative, there is nothing to record.

**Qualifies:**

- Architectural shape and boundaries: which system owns which data, which layer may call which.
- Integration patterns with external systems, and the contract constraints behind them.
- Technology choices with lock-in: the ones that take weeks to swap, not every library.
- Deliberate deviations from the obvious path, so the next engineer does not "fix" them.
- Constraints not visible in the code: compliance, a partner API limit, a contractual SLA.
- Rejected alternatives whose rejection is not obvious.

**Does not qualify** — write nothing, or put it where it belongs:

- How a feature behaves (what a page shows, when a panel closes, which fields an event sends). That is a requirement: the ticket and the tests record it.
- Following a standard or an existing project pattern (an ARIA pattern, a shared component, a lint rule). The code shows it.
- Layout, styling, copy, and tracking payload details.
- A refinement of an existing decision that does not change its reason.

The default outcome of a ticket is **no ADR**. Offer one to the user; write it only after they agree.

## Shape

```md
# {The decision, stated as a claim}

{1–3 sentences: the context, the decision, and why.}
```

That is a complete ADR. Add these only when they carry weight; most ADRs need none of them:

- `**Status:** proposed | accepted | deprecated | superseded by ADR-NNNN` — when the decision is likely to be revisited. An ADR without a Status line counts as accepted.
- `**Ticket:** {link}` — the provenance. Keep it out of the body.
- `## Considered options` — only when a rejected option will be suggested again.
- `## Consequences` — only when a downstream effect is not obvious.

## Rules

- **Look for an existing ADR first.** Search `docs/adr/` for a decision on the same topic. When one exists and its decision changes, supersede it. When it still holds, write nothing. Never write a second ADR next to it.
- **Back the "why" with a checkable constraint**: a repository fact, an API contract, a documented limit, or a dated measurement. The reader can test it and disagree.
- **No provenance in the body.** "The client asked for X" belongs to the ticket link.
- **Never edit an accepted ADR.** No "Amendments" section. When the decision changes, write a new ADR and add or set the old one's status line to `superseded by ADR-NNNN` — that status line is the only edit allowed. When only behavior details change, write nothing.
- **Name code sparingly.** Every path and symbol in an ADR goes stale when the code moves. Name the boundary or the module, not the file and line.

## Filename and number

Save to `docs/adr/`, created only when the first ADR is needed. Continue the filename
convention already there; use `NNNN-kebab-title.md` when the directory is empty.

Take one more than the highest number on the default branch and in the working tree. The
default branch holds the numbers that parallel branches already merged. The working tree
holds the ADRs of this branch, committed or not, so two new ADRs never share a number:

```bash
git fetch origin <default-branch>
git ls-tree --name-only origin/<default-branch> docs/adr/
ls docs/adr/
```

Check again before the merge, after you rebase onto the default branch. If the number was
taken in the meantime, renumber.

## Example

```md
# The product listing reads from the search index, not from the product database

The listing page must answer in 200 ms, and a filtered query on the product database takes
2 s (measured 2026-03-04). The listing therefore reads from the search index. A price
change can take up to 5 minutes to appear on the listing.
```

## Language

Use Simplified Technical English, as in the plan: one idea per sentence, active voice,
present tense, about 20 words. Keep one term for one thing. Code identifiers, file paths,
and commands stay verbatim.
