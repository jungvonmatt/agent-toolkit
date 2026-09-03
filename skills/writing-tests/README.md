# writing-tests

Enforces behavior-first, mutation-sensitive automated tests. Kicks in
automatically whenever you author or refactor a test file — unit, component, or
integration.

Core rules:

1. **Test atomic units first** — cover pure logic directly before testing it through a component.
2. **Focus on user behavior** — assert what the user observes, not internal state.
3. **Keep tests fast and maintainable** — one intent per test, Arrange-Act-Assert.

Plus the non-negotiable **mutation test**: if the test stays green after you
delete the code under test, the test is worthless.

Query rules for component tests:

- Prefer ARIA role and accessible name (`getByRole('button', { name: /checkout/i })`).
- Fall back to label, text, or `data-testid`.
- Never locate an element by class name. Prefer asserting the user-visible effect over a class, but a `classList` check is an acceptable last resort when the class is the visual-state contract.

Data-fetching composables: run the **real** composable against a network mocked
with [MSW](https://mswjs.io/) — never stub the composable and assert your own
value. And never write a useless test just to raise coverage.

## Install

```bash
npx skills add jungvonmatt/agent-toolkit/skills/writing-tests --global
```

## Usage

The skill applies automatically while you write a test. You can also invoke it:

```text
Write tests for this component
```

```text
Review these tests for behavior-first quality
```

## Reference

- [`references/examples.md`](references/examples.md) — good-versus-bad patterns for queries, assertions, mutation testing, and atomic units.
