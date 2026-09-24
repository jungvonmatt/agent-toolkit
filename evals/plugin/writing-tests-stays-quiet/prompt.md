---
description: A mechanical module conversion with no test work. writing-tests must not fire.
expected_outcome: The module is converted to ES module syntax; writing-tests is never invoked.
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Convert this module from CommonJS to ES modules. Keep the behavior identical. Reply with the changed code; do not write files.

```js
// src/price.js
const { currencyFor } = require('./locale');

function formatPrice(cents, locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyFor(locale) }).format(cents / 100);
}

module.exports = { formatPrice };
```
