# ADR Template

An ADR records a decision so that a future reader can re-evaluate it. That reader has no
access to the conversation that produced the decision. Everything needed to challenge it
must be on the page.

Save to `docs/adr/`. Scan that directory first and continue the filename convention already
there. Use `NNNN-kebab-title.md` only when the directory is empty.

## Shape

```md
# {Decision, stated as a claim}

**Status:** Proposed | Accepted | Superseded by {ADR}
**Date:** {YYYY-MM-DD}
**Ticket:** {link}

## Context
{The required behaviour, stated declaratively. Then the constraints that make it hard.}

## Decision
{What was chosen.}

## Consequences
{What follows, including the costs you accept.}

## Rejected alternatives
{Each option, with the constraint that ruled it out.}
```

Keep `Status`, `Consequences` and `Rejected alternatives` only when they carry weight. A
one-paragraph ADR is a valid ADR.

## Sentence contract

The header carries the provenance. The body carries the system. Every sentence in the body
is one of these kinds, and each kind has a fixed subject:

| Sentence kind | Subject | Example |
|---|---|---|
| Requirement | the system and the behaviour it must have | "The export runs nightly and writes one file per region." |
| Rationale | a constraint the reader can check | "The upstream API caps a response at 1000 rows, so one request cannot cover a region." |
| Accepted cost | the mechanism and its effect | "A region added mid-month appears in the next run, not the current one." |
| Future work | an observable condition | "Revisit if a per-hour export requirement appears." |
| Evidence | a dated observation | "Measured 2026-03-04: the endpoint returned 1000 rows for every region." |

A constraint is checkable: a repository fact, an API contract, a schema, a documented limit,
or a dated measurement written into the ADR. The reader can test it and can disagree with
it. That is what keeps the decision open to re-evaluation.

No body sentence names who requested the behaviour. "The client asked for a category filter"
is provenance — it belongs to the header's `Ticket` link, not the body. State the requirement
instead: "The category filter appears in the filter slide-in of the product listing page."

## Worked example

```md
## Context

The nightly export writes one file per region. The upstream API caps a response at 1000
rows, and the largest region holds 4200 rows. One request therefore cannot cover a region.

## Decision

The export pages through the API and concatenates the pages for each region.

## Consequences

- A region added mid-month appears in the next run, not the current one.
- Revisit if a per-hour export requirement appears.
```

## Language

Use the same Simplified Technical English rules as the plan: one idea per sentence, active
voice, present tense, about 20 words. Keep one term for one thing. Code identifiers, file
paths and commands stay verbatim.
