---
type: llm
---

PASS if the reply adds a doc comment to `splitEvenly` whose first line is a one-sentence summary that says more than the name (for example, that the parts differ by at most one cent and the first parts get the extra cents), and that documents both `RangeError` conditions.

FAIL if the doc comment puts types in braces on `@param` or `@returns` (`{number}`, `{number[]}`), has a tag that only repeats the parameter name (`@param parts - The parts`), opens with "This function", runs longer than ten lines, or if the reply adds comments inside the function body that narrate what each line does.
