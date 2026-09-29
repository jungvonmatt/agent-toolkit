---
description: A request to document an exported TypeScript function. technical-writing should fire, and the doc comment should state the contract without echo tags or repeated types.
expected_outcome: A TSDoc comment with a one-line summary that says how the cents are distributed, the RangeError conditions, no JSDoc types, and no narration comments inside the body.
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Other teams will call this function from our shared package. Document it for them. Reply with the changed code; do not write files.

```ts
// src/money.ts
export function splitEvenly(totalCents: number, parts: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) throw new RangeError('totalCents must be a non-negative integer')
  if (!Number.isInteger(parts) || parts < 1) throw new RangeError('parts must be a positive integer')
  const base = Math.floor(totalCents / parts)
  const remainder = totalCents % parts
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0))
}
```
