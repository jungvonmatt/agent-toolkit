# Technical blog posts

A good engineering post teaches one thing through one real case: real code, real numbers, and the honest story of what went wrong. Depth and specifics make it worth reading. Generic advice does not.

## Before you draft

- **One idea.** State the one thing the reader takes away, in one sentence. A second idea is a second post. A short post that ships beats a complete one that does not.
- **One reader.** Name them: often the author six months ago. Keep the assumed knowledge at their level for the whole post.
- **The facts.** Collect the code, the commands, the before-and-after numbers, and the dead ends from the author or the repository. Never invent a benchmark, a quote, or a result. Leave `TODO: p95 before the change` where a number is missing.

## Structure

1. **Title:** promise a specific payoff and name the technology. "How we cut p99 latency from 800 ms to 90 ms by removing a mutex", not "Thoughts on performance".
2. **First three sentences:** who this is for, the problem, and the result. A reader who stops here knows whether to read on.
3. **The problem:** concrete, with the real numbers and the real constraint.
4. **The body:** one running example (the touchstone) carries the explanation. Show the code, the commands, the output, and a diagram where parts interact.
5. **Dead ends:** what did not work and why. Mark wrong code clearly, so no reader copies it.
6. **Trade-offs and limits:** when this approach is the wrong choice.
7. **Stop:** end on the next step or a link, not a recap.

The headings and figures alone should tell the story to a reader who skims.

## Rules

- **Voice:** first person ("we", "I") is right for a blog post. Keep the core rules from `SKILL.md`, but vary sentence length for rhythm. A sentence above 30 words needs a reason.
- **Concrete before abstract:** show the example, then name the principle. Use realistic names (`invoice`, `retryPolicy`), not `foo` and `bar`. Keep an analogy to two sentences.
- **Back every claim** with an example, a number, or a link. Say "I think" where you are not sure. One honest hedge beats false certainty.
- **Show your work:** real stack traces, real flame graphs, real diffs. Specifics are what reviews tend to strip out, and they are what readers come for.
- **Images:** diagrams, screenshots, and charts that carry information. Leave out stock photos and decorative AI images.
- **Company posts:** check with the author what they may publish (customer names, internal numbers, security details) before you write it down.

## Checklist

- [ ] The title names the technology and a specific payoff.
- [ ] The first three sentences state the reader, the problem, and the result.
- [ ] The post has one idea, carried by one running example.
- [ ] Every number, benchmark, and quote comes from the author or a source, or is a visible `TODO:`.
- [ ] Dead ends and trade-offs are in the post.
- [ ] The post ends on a next step or a link, not a summary.
