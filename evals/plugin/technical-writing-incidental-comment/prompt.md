---
description: A bug fix where a one-line why-comment is natural. An incidental comment is not documentation work, so technical-writing must not fire.
expected_outcome: The last page no longer drops its final item; technical-writing is never invoked.
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

The last page of the product list is always missing its final item. Fix the bug. Reply with the changed code; do not write files.

```ts
// src/pagination.ts
export function pageSlice<T>(items: T[], page: number, size: number): T[] {
  const start = (page - 1) * size
  const end = Math.min(start + size, items.length - 1)
  return items.slice(start, end)
}
```
