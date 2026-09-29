---
description: A mechanical refactor with no comment or documentation work. technical-writing must not fire.
expected_outcome: The nested conditions become early returns with identical behavior; technical-writing is never invoked.
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Flatten the nested ifs in this function into early returns. Keep the behavior identical. Reply with the changed code; do not write files.

```ts
// src/shipping.ts
export function shippingCents(country: string, subtotalCents: number): number {
  if (country === 'DE') {
    if (subtotalCents >= 5000) {
      return 0
    } else {
      return 495
    }
  } else {
    return 1290
  }
}
```
