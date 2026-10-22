# Framework caveats for mocked data fetching

Read the section for the project's framework before you set up MSW. The general rules in `SKILL.md` still apply.

## Nuxt: ofetch may hold the unpatched fetch

Nuxt does not call the global `fetch` directly. It uses `ofetch` (exposed as `$fetch` / `useFetch`). Older `ofetch` captured a reference to `globalThis.fetch` **at import time**, so a later MSW patch never reached it and the request slipped through. `ofetch` fixed this (unjs/ofetch#377, from `ofetch` 1.4.0): the current version calls the patched global `fetch`, so MSW intercepts normally once the server listens before the request.

- **Prefer the fix over a workaround.** Upgrade to a recent `ofetch` (Nuxt 3 latest). Then only the usual rule applies: `server.listen()` runs before the first request, ideally in a Vitest `setupFiles` entry.
- **On an old `ofetch` that still escapes interception,** pass the live global fetch into the instance instead of stubbing the composable:

  ```ts
  useFetch(url, {
    $fetch: createFetch({ fetch: globalThis.fetch, Headers: globalThis.Headers }),
  })
  ```

  The [`nuxt-msw`](https://github.com/shunnNet/nuxt-msw) module wires this up for you.
- If a request still slips through, confirm the server listens before the first `$fetch` call and that the intercepted URL (including the base URL Nuxt prepends) matches the handler.

## Next.js: worker vs. server, and instrumentation

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
