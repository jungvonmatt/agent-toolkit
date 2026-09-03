---
name: writing-tests
description: Use when writing, reviewing, or refactoring any automated test — unit, component, or integration. Kicks in automatically whenever you author a test file (*.test.*, *.spec.*) or a component test. Enforces behavior-first, mutation-sensitive tests that query by ARIA role or label, never by class name.
---

# Writing Tests

Write tests that fail for the right reason: a real change in behavior. A good test proves the code does its job; a bad test passes even after the logic is gone. This skill applies to every automated test you author or change, and it kicks in automatically while you write a test file.

The examples use Vitest with Vue Test Utils and Testing Library, but the principles apply to any framework and any runner. Read [`references/examples.md`](references/examples.md) for good-versus-bad patterns.

**Use Testing Library when it fits the stack.** If a Testing Library package for the current stack is already installed (`@testing-library/react`, `@testing-library/vue`, `@testing-library/dom`, `@testing-library/svelte`, and so on), use its role- and label-based queries. If none is installed but one exists for the stack, ask the user to install it before writing the tests rather than falling back to brittle selectors. If no variant exists for the stack, apply the same query priority with the runner's native API.

## The three rules

1. **Test atomic units first.** Cover the smallest testable unit before the larger flow. Push logic into pure functions and test those directly. It is fine to refactor a component to expose a testable unit when the refactor also improves the code. Reserve component and integration tests for behavior that only appears when the parts work together.
2. **Focus on user behavior.** Test what the user observes and does — rendered output, interactions, emitted events, side effects. Do not test internal state, private methods, or implementation details.
3. **Keep tests fast and maintainable.** One intent per test. Follow Arrange-Act-Assert. Reuse shared fixtures instead of re-declaring test data inline. A reader must grasp the intent in seconds without decoding setup.

## Never write a useless test

Do not write a test for the sake of coverage, a green checkmark, or a ratio. Every test must earn its place by proving a real behavior can break. When a proposed test proves nothing — it only re-checks the framework, a constant, or a render — do not write it. Fewer strong tests beat many hollow ones.

A test is useless when any of these is true:

- It passes the mutation test check trivially — the code under test can be deleted and the test stays green.
- It asserts a literal or a constant that the test itself supplies.
- It only confirms a component mounts or a value is defined.
- It restates the implementation line for line instead of asserting an outcome.
- It duplicates a stronger test already present.

Write a few targeted cases, not every permutation. Three to five well-chosen cases — the happy path, one or two meaningful edge cases, and the error path — beat a generated matrix of inputs that all exercise the same branch. Each test verifies a unique aspect.

If you cannot state the one real behavior a test protects, do not write that test.

## The mutation test (non-negotiable)

Before you keep a test, delete the code it claims to cover — in your head or for real. If the test is still green, the test is worthless. Rewrite it.

- A test must fail when the main logic of the unit is removed.
- A test that only checks that a component renders, or that a static label exists, does not prove the logic works.
- Assert on the outcome the logic produces, not on the fact that the code ran.

## Query rules (component tests)

Identify elements the way a user or assistive technology finds them. Follow the [Testing Library query priority](https://testing-library.com/docs/queries/about/#priority), top to bottom:

1. **Role + accessible name** — `getByRole('button', { name: /checkout/i })`. Your first choice for almost everything; it also proves the element is in the accessibility tree.
2. **Label, placeholder, or text** — `getByLabelText` for a form field, then `getByText` for non-interactive content.
3. **`data-testid`** — the last resort, only when no role or text fits (for example dynamic content).
4. **Never locate elements by class name, id, or `container.querySelector`.** This is the one rule with no exceptions: never find an element by its class and then run assertions on it. The locator couples to styling, proves nothing about accessibility, and either breaks on a visual refactor or silently matches the wrong node.

**Fix the markup, do not fake the query.** If an element has no suitable role, make it accessible — associate a `<label>`, set an input `type`, use semantic HTML — instead of querying by class or adding a bogus `role`/`aria-*` just so a test can find it. A hard-to-query element is usually a hard-to-use element.

**Prefer the user-visible effect over a class-name assertion.** Assert a role state (`aria-pressed`), visible text, or `aria-hidden` whenever one exists — `expect(el.classList).toContain('is-active')` tells you nothing when `aria-pressed` is right there. A `classList.contains(...)` assertion is an acceptable last resort only when the class *is* the observable contract of a visual-state change and no semantic signal represents it. Even then, locate the element by role or text first, then assert on its class — never the reverse.

**Use semantic matchers.** Prefer `toBeDisabled()`, `toBeVisible()`, `toBeChecked()`, or `toHaveAccessibleName()` over a raw property or boolean assertion like `expect(el.disabled).toBe(true)`. The matcher reads clearer and fails with a far better message.

## Composables and hooks

Match the test to what the composable depends on:

- **Reactivity only** (refs, computed, watch) — invoke it directly and assert the returned state and methods. No component needed.
- **Lifecycle hooks or provide/inject** — mount it in a minimal host component (a `withSetup` helper) so the hooks run, then assert.
- **Data fetching** — see below: run the real composable against a mocked network.

## Composables that fetch data

When you test a composable, function, or hook that fetches data, test the **real** composable against a **mocked network**. Do not mock the composable itself and then assert on the value you fed it — that test proves nothing about the composable.

- **Mock at the network boundary with [Mock Service Worker (MSW)](https://mswjs.io/).** Intercept the HTTP request and return a controlled response. The composable runs its real logic: request building, loading and error states, response parsing, and mapping.
- **Do not stub the composable's return value.** A stub bypasses the exact logic the test should protect.
- **Do not mock `fetch`, `axios`, or the client by hand** when MSW can intercept the request. MSW keeps the test close to real behavior and independent of the client library.
- **Assert the observable output for each network outcome:** the mapped success data, the loading state during the request, and the error state on a failed or non-2xx response.

Set up one MSW server for the test suite. Override individual handlers per test to simulate success, empty, and error responses. See [`references/examples.md`](references/examples.md) for a full example.

### Nuxt caveat: ofetch may hold the unpatched fetch

Nuxt does not call the global `fetch` directly. It uses `ofetch` (exposed as `$fetch` / `useFetch`). Older `ofetch` captured a reference to `globalThis.fetch` **at import time**, so a later MSW patch never reached it and the request slipped through. `ofetch` fixed this (unjs/ofetch#377, from `ofetch` 1.4.0): the current version calls the patched global `fetch`, so MSW intercepts normally once the server listens before the request.

- **Prefer the fix over a workaround.** Upgrade to a recent `ofetch` (Nuxt 3 latest). Then only the usual rule applies: `server.listen()` runs before the first request, ideally in a Vitest `setupFiles` entry.
- **On an old `ofetch` that still escapes interception,** pass the live global fetch into the instance instead of stubbing the composable:

  ```ts
  useFetch(url, {
    $fetch: createFetch({ fetch: globalThis.fetch, Headers: globalThis.Headers }),
  })
  ```

  The [`nuxt-msw`](https://github.com/shunnNet/nuxt-msw) module wires this up for you.
- **Set `onUnhandledRequest: 'error'`.** A request that escaped interception then fails loudly instead of passing on live data.
- If a request still slips through, confirm the server listens before the first `$fetch` call and that the intercepted URL (including the base URL Nuxt prepends) matches the handler.

### Next.js caveat: worker vs. server, and instrumentation

In a Vitest or Jest test (jsdom or node), MSW works the normal way: `server.listen()` in a setup file. The Next.js-specific quirks below apply to the **running app** (dev server, SSR, Server Components), which you meet in end-to-end tests or manual runs, not in unit or component tests.

- **Client components** are intercepted by the browser service worker (`worker.start()`), the same as any browser app.
- **Server-side code** (Server Components, Route Handlers, `getServerSideProps`) runs in Node. Historically MSW could not patch it because of Next.js's process model. The supported fix is to start MSW from `instrumentation.ts`:

  ```ts
  // instrumentation.ts
  export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { server } = await import('./mocks/node')
      server.listen()
    }
  }
  ```

- Next.js also patches the global `fetch` for its own caching. Set `cache: 'no-store'` (or the route to dynamic) in a test so the patched cache does not return a stale response instead of the mocked one.
- Use MSW's `request:start` life-cycle event to confirm interception when a server-side request seems to bypass the handlers.

## Mock only at the boundaries

Every mock is a place where the test stops proving the real code. Keep mocks at the edges of the system and run the real thing everywhere else.

- **Mock only a dependency that** does I/O, has a side effect, is slow, or reaches an external service (network, database, time, randomness, analytics).
- **Never mock** a pure function, a utility, a constant, or a simple computation. A mock there only asserts your own stub and hides real breakage — run the real one.
- **Prefer the real implementation** for closer-to-production integration. Reach for a mock only when the real dependency makes the test slow, flaky, or non-deterministic.
- **Stub a presentational-only child** (an icon, a thin wrapper) or a heavy third-party component. **Never stub an interactive child** — a button, an input, a form — or a component that provides the behavior under test.
- **Test a form through its real flow:** type into the fields, submit with a real `<button type="submit">`, then assert the validation, the request, and the emitted events. Drive it with realistic user interactions, not synthetic value assignments.

## What to test (component APIs)

Treat the component as a black box and test its external surface:

- **User interaction** — a `@click`, `@input`, or `@change` should produce an observable effect.
- **Props** — different prop values should change the observable output or behavior.
- **Emitted events** — the component emits the correct event with the correct payload.
- **Received events** — input from a child produces the expected reaction.
- **Global state** — a given store state produces the expected output.
- **Side effects** — an expected service or callback runs when it should.
- **DOM effects** — an interaction shows, hides, or updates the right visible output.

## What NOT to test

- The resulting internal state after an event — assert on the visible DOM instead.
- Component methods called directly — trigger the event that would call them.
- Class names, style values, or DOM structure that carries no meaning to the user.
- Third-party libraries or the framework itself.
- Snapshots of large trees — they pass through real regressions and break on trivial edits.

## Async and user interaction

- **Drive interactions with `userEvent`, not `fireEvent`.** `userEvent.click`, `.type`, and `.selectOptions` fire the full event sequence a real user triggers; `fireEvent` fires one synthetic event and can miss handlers.
- **Await appearance with `findBy*`,** not `waitFor(() => getBy*)`. `findByRole('alert')` is simpler and gives a better error than a manual wait.
- **Use `queryBy*` only to assert absence** — `expect(queryByRole('alert')).not.toBeInTheDocument()`. For anything present, `getBy*` and `findBy*` throw a helpful DOM dump; `queryBy*` returns `null` and hides the cause.
- **Put one assertion in a `waitFor` callback, and no side effects.** `waitFor` runs the callback many times. Trigger the interaction outside it and wait only on the assertion.

## Workflow

1. **Name the behavior.** State the one thing the test proves, from the user's point of view. The `it` description reads as that sentence.
2. **Pick the smallest level.** Test a pure function directly when the logic is pure. Use a component test only for behavior that needs the component.
3. **Arrange with intent.** Mount with the minimal setup. Extract a bloated setup into a named helper (for example `whenCartIsEmpty()`).
4. **Act once.** Trigger one interaction, one prop change, or one event.
5. **Assert on the outcome.** Query by role or label. Assert the observable effect that the logic produces.
6. **Run the mutation test.** Confirm the test fails when the covered logic is removed. Keep the test only when it does.
7. **Run the suite.** Run the tests and confirm they pass before you finish. A test you did not run is not done.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It renders without crashing, so it works." | A render test stays green after you delete the logic. It proves nothing. |
| "I'll query by class, it's quicker." | A style refactor then breaks a green feature. Query by role or `data-testid`. |
| "I'll assert the internal flag is true." | Internal state is an implementation detail. Assert the visible result. |
| "A snapshot covers everything." | Large snapshots hide real regressions and break on noise. Assert on intent. |
| "I'll call the method directly." | Users do not call methods. Trigger the event that calls it. |
| "One big test covers the whole flow." | Mixed intent hides which behavior broke. One intent per test. |
| "I'll mock the composable and check the value." | You then assert your own stub. Mock the network with MSW and run the real composable. |
| "I need a test here to hit coverage." | Coverage is not the goal. A test that proves nothing is worse than no test. |
| "I'll mock this helper to isolate the unit." | Mocking a pure helper asserts your stub, not the code. Run the real helper. |
| "More cases mean better coverage." | Redundant cases that hit the same branch add noise, not safety. Test unique aspects. |
| "`fireEvent` is good enough." | It fires one event. `userEvent` fires the real sequence and catches handlers `fireEvent` misses. |
| "I'll wait with an empty `waitFor`, then assert." | An empty `waitFor` is fragile. Wait on the assertion itself, or use `findBy*`. |

## Red Flags

- A test with no meaningful assertion, or only `expect(wrapper.exists()).toBe(true)`.
- An element located by class name, then asserted on — never acceptable. (Asserting `classList` on an element found by role or text is fine when the class is the visual-state contract.)
- An assertion on `wrapper.vm.<privateState>` or a directly invoked component method.
- A test that stays green after you delete the code under test.
- A composable data-fetch test that stubs the composable instead of mocking the network.
- A mock of a pure function, utility, or constant that has no I/O and no side effect.
- A stubbed button, input, or form — the interactive part under test replaced by a fake.
- A `waitFor(() => getBy...)` where `findBy*` would do, or a `queryBy*` used to assert presence.
- A `waitFor` callback with a side effect inside, or with more than one assertion.
- A raw property assertion (`el.disabled`, `el.value`) where a semantic matcher exists.
- A test written only to raise coverage, or a batch of near-identical cases hitting one branch.
- A setup section longer than the act and assert sections combined.
- A large snapshot standing in for real behavioral assertions.

## Verification

Before you finish a test file:

- [ ] Every test states one user-visible behavior in its description.
- [ ] Every test fails when the covered logic is removed (mutation test passed).
- [ ] No test locates an element by class name; any `classList` assertion is on an element found by role or text and covers a real visual-state contract.
- [ ] Element queries follow the priority ladder (role → label/text → `data-testid`); the markup was fixed rather than a role faked.
- [ ] Async elements use `findBy*`; `queryBy*` is used only to assert absence.
- [ ] Interactions use `userEvent`; each `waitFor` holds one assertion and no side effect.
- [ ] Element queries prefer ARIA role and name; `data-testid` is the fallback.
- [ ] No test asserts on internal state or calls a component method directly.
- [ ] Mocks are limited to I/O, side effects, or external services; no pure function is mocked.
- [ ] Interactive children (buttons, inputs, forms) are not stubbed.
- [ ] A data-fetching composable is tested through the network layer with MSW, not by stubbing the composable.
- [ ] `server.listen()` runs before the first request, and `onUnhandledRequest` is set to `error`. In Nuxt, `ofetch` is recent enough to use the patched fetch (or the test passes a live `fetch` via `createFetch`).
- [ ] Every test protects one stated behavior — no test exists only for coverage.
- [ ] Pure logic is tested at the unit level, not only through the component.
- [ ] No redundant cases — each test verifies a unique aspect.
- [ ] Each test follows Arrange-Act-Assert and reads clearly.
- [ ] The tests were run and pass.
