---
name: technical-writing
description: Use when writing or updating code comments or doc comments (JSDoc, TSDoc, KDoc, Javadoc, docstrings), when documenting a project, API, or process for human readers (README, guide, reference, runbook, changelog, release notes), or when drafting a technical blog post.
---

# Technical Writing

Write for **the reader**: a busy developer who skims, searches, and often reads in a second language. Great technical writing gives that reader what they need to act or understand, in the fewest plain words, and nothing more.

## 1. Route to the branch

| You write | Read before you draft |
|---|---|
| An inline comment or a doc comment | [`references/code-comments.md`](references/code-comments.md) |
| A README, tutorial, how-to guide, reference, explanation, runbook, changelog, or ADR | [`references/documentation.md`](references/documentation.md) and [`references/simplified-technical-english.md`](references/simplified-technical-english.md) |
| A technical blog post or article | [`references/blog-posts.md`](references/blog-posts.md) |

A document an agent consumes (a skill, `AGENTS.md`, `CLAUDE.md`) follows `writing-for-agents` when it is installed. PR descriptions and tickets have their own skills: `pr-description` and `write-ticket`.

## 2. Name the reader and the job

Settle three facts before the first sentence. Keep them in your head, not in the output.

- **Reader:** who reads this and what they already know: a new team member, an API consumer, the next maintainer at this line of code.
- **Job:** what the reader can do or understand after reading, in one sentence. When you cannot state it, read more code or ask the user.
- **Place:** where they read it: an IDE hover, a GitHub README, a docs site, a feed. The place sets the length.

Read the neighbouring docs and comments first. Match their language, terminology, heading style, and tag style. A project style guide overrides the defaults in this skill.

## 3. Draft with the core rules

Every branch applies these rules. The branch reference adds its own and may relax a number.

1. **Lead with the point.** The first sentence of every document, section, paragraph, and comment carries its main message: bottom line up front. Background follows only when the reader needs it.
2. **One idea per sentence.** Keep sentences short: at most 20 words in an instruction, 25 in a description. Split a long sentence at "and", "which", or a semicolon.
3. **Active voice, present tense, "you".** Name who does what: "The parser returns `null`", not "`null` is returned". Write instructions in the imperative: "Run `npm install`."
4. **One term per concept.** Use the exact name from the code, the UI, or the domain, and keep it. A new word tells the reader a new thing exists, so a synonym for variety is a bug. Define a term the reader may not know at its first use.
5. **Concrete beats abstract.** Give the name, the number, the command, the example: "cuts cold start from 1.2 s to 300 ms", not "improves performance significantly".
6. **Plain words.** Pick the short common word: use, start, help, show, about, so, to.
7. **Derive, never invent.** Every name, path, command, flag, version, and number traces to the code, a command you ran, or a source you read. Mark a fact you cannot verify as a visible `TODO:` for the author.
8. **Lists for scanning, prose for reasoning.** Number a sequence, bullet parallel items, tabulate a comparison, fence code with a language tag. Explain a *why* in full sentences.

## 4. Revise with the cut test

Revise every draft in three passes:

1. **Cut test.** For each sentence, ask: does the reader lose something they need when it goes? If not, delete the whole sentence. A sentence that says nothing still says nothing after you trim its words. Intros that announce what follows, outros that repeat what came before, and sentences that restate a heading fail the test.
2. **Slop sweep.** Replace every AI-writing tell in the table below with the plain statement it hides.
3. **Fact check.** Reopen the code or rerun the command behind every claim. Run each code sample, or check it line by line against the source.

| Slop tell | Replace with |
|---|---|
| "delve", "leverage", "utilize", "robust", "seamless", "crucial", "pivotal", "showcase", "enhance" | the plain verb, or the measurable property: "retries 3 times" |
| "serves as", "stands as", "represents"; "boasts", "features", "offers" | "is"; "has" |
| "It's important to note that …", "It's worth noting …" | the note itself |
| A trailing "-ing" clause: "…, ensuring reliability", "…, highlighting the need for …" | nothing, or the fact in its own sentence |
| "not just X, but Y"; "it's not X, it's Y" | the plain claim: "X does Y." |
| Three items for rhythm: "fast, reliable, and scalable" | only the claims you can back |
| "Experts agree", "Industry reports show" | the named and linked source, or nothing |
| "In conclusion", "Overall,", a closing recap | the last useful fact or the next step |
| "simply", "just", "easy", "obviously" | nothing: these words blame the reader who struggles |
| Stacked hedges: "may potentially help" | one hedge where doubt is real |
| Bold phrases in every paragraph, a bold label on every bullet, emoji or Title Case in headings | sentence-case headings, bold only for the term a reader scans for |
| An em dash in every paragraph | a period, a comma, a colon, or parentheses |
| "Certainly!", "Let's dive in", "Here is a …", "I hope this helps" | nothing |

## Done when

- [ ] Every section serves the reader's job.
- [ ] Every sentence passed the cut test.
- [ ] Every name, path, command, flag, and number matches the code or a command you ran.
- [ ] No slop tell remains.
- [ ] The checklist in the branch reference is met.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "More detail is safer." | Detail the reader does not need buries the detail they do. |
| "A comment on every function looks thorough." | Noise trains readers to skip comments, including the one that warns them. |
| "An intro paragraph sets the context." | The reader came for the answer. Lead with it. |
| "Varied wording reads better." | Each new word signals a new concept. Keep one term. |
| "A plausible value is better than a gap." | An invented flag or number ships a bug to every reader. Leave a `TODO:`. |
| "A summary at the end helps." | It repeats the page. End on the next step. |
