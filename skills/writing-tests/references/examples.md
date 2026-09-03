# Test patterns: good vs bad

Concrete examples for the rules in `SKILL.md`. The examples use Vitest with Vue
Test Utils and Testing Library, but the principles carry to any framework and
runner. Adapt the query API to your stack (`@testing-library/react`,
`@testing-library/dom`, and so on).

## 1. Query by role or accessible name, not by class

The user finds a button by its role and label. The test must do the same.

```ts
// 👏 Good — queries the way a user (and a screen reader) finds it
it('emits "checkout" when the user clicks the checkout button', async () => {
  const wrapper = mount(Cart, { props: { items: [item] } })

  await wrapper.get('button[aria-label="Checkout"]').trigger('click')
  // or with Testing Library: screen.getByRole('button', { name: /checkout/i })

  expect(wrapper.emitted('checkout')).toBeTruthy()
})
```

```ts
// 👎 Bad — couples the test to styling; a CSS refactor breaks a working feature
it('emits "checkout" when clicking .btn--primary', async () => {
  const wrapper = mount(Cart, { props: { items: [item] } })

  await wrapper.get('.btn--primary').trigger('click')

  expect(wrapper.emitted('checkout')).toBeTruthy()
})
```

Fallback order when no role fits: `getByLabelText` → `getByText` →
`data-testid`. Wrap `data-testid` lookups in a small helper so the attribute is
easy to change:

```ts
// test-utils.ts
export const testId = (id: string) => `[data-testid="${id}"]`
```

## 2. Assert the user-visible effect, not a class name

```ts
// 👏 Good — asserts the accessible state the user perceives
it('marks the filter as pressed when the user activates it', async () => {
  const wrapper = mount(FilterToggle)

  await wrapper.get('button', { name: /in stock/i }).trigger('click')

  expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
})
```

```ts
// 👎 Bad — asserts an arbitrary class when a semantic signal exists
it('adds the is-active class when clicked', async () => {
  const wrapper = mount(FilterToggle)

  await wrapper.get('button').trigger('click')

  expect(wrapper.get('button').classes()).toContain('is-active')
})
```

A `classList` assertion is only defensible when the class *is* the observable
contract of a visual state and nothing semantic (`aria-pressed`, text,
`aria-hidden`) represents it — and even then, locate the element by role or text
first, never by the class itself.

## 3. Assert the DOM outcome, not internal state

```ts
// 👏 Good — the user sees the alternative address form appear
it('shows the alternative address form when the checkbox is checked', async () => {
  const wrapper = mount(CustomerData)

  await wrapper.get('input[type="checkbox"]').setValue(true)

  expect(wrapper.find(testId('alternative-address-form')).exists()).toBe(true)
})
```

```ts
// 👎 Bad — asserts a private flag; a rename of the flag breaks a working feature
it('sets hasAlternativeAddress to true when the checkbox is checked', async () => {
  const wrapper = mount(CustomerData)

  await wrapper.get('input[type="checkbox"]').setValue(true)

  expect(wrapper.vm.hasAlternativeAddress).toBe(true)
})
```

## 4. Trigger the event, do not call the method

```ts
// 👏 Good — the user clicks; the method runs as a consequence
it('navigates to checkout when the user clicks the checkout button', async () => {
  const push = vi.fn()
  const wrapper = mount(Cart, { global: { mocks: { $router: { push } } } })

  await wrapper.get('button', { name: /checkout/i }).trigger('click')

  expect(push).toHaveBeenCalledWith('/checkout')
})
```

```ts
// 👎 Bad — invokes an implementation detail the user never touches
it('navigates when goToCheckout is called', async () => {
  const push = vi.fn()
  const wrapper = mount(Cart, { global: { mocks: { $router: { push } } } })

  await wrapper.vm.goToCheckout()

  expect(push).toHaveBeenCalledWith('/checkout')
})
```

## 5. The mutation test in practice

A render-only test survives deletion of the logic — so it proves nothing.

```ts
// 👎 Worthless — stays green even if the total calculation is removed
it('renders the cart', () => {
  const wrapper = mount(Cart, { props: { items } })
  expect(wrapper.exists()).toBe(true)
})
```

```ts
// 👏 Good — fails the moment the total calculation is wrong or removed
it('shows the summed total for the items in the cart', () => {
  const wrapper = mount(Cart, { props: { items: [{ price: 10 }, { price: 5 }] } })

  expect(wrapper.get(testId('cart-total')).text()).toContain('15')
})
```

## 6. Test atomic units directly

Pure logic does not need a component. Test it at its own level; then the
component test only proves the wiring.

```ts
// 👏 Good — pure function, fast and exhaustive
import { formatPrice } from './format-price'

it.each([
  [0, '€0.00'],
  [1234, '€12.34'],
  [-500, '-€5.00'],
])('formats %d cents as %s', (cents, expected) => {
  expect(formatPrice(cents)).toBe(expected)
})
```

## 7. Extract bloated setup into a named helper

```ts
// cart-spec-utils.ts
export const whenCartIsEmpty = (props = {}) =>
  mount(Cart, { props: { items: [], ...props } })
```

```ts
// cart.spec.ts
import { whenCartIsEmpty } from './cart-spec-utils'

it('shows an empty-cart message when the cart has no items', () => {
  const wrapper = whenCartIsEmpty()

  expect(wrapper.find(testId('empty-cart-message')).exists()).toBe(true)
})
```

## 8. Composables that fetch data — mock the network, not the composable

Run the real composable against a mocked network with
[MSW](https://mswjs.io/). This proves the request, the loading and error
states, and the response mapping all work.

```ts
// setup: one server for the suite
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

```ts
// 👏 Good — the real useProducts composable runs; only the network is mocked
it('maps the fetched products into the list', async () => {
  server.use(
    http.get('/api/products', () =>
      HttpResponse.json([{ id: 1, title: 'Shoe', price_cents: 1999 }]),
    ),
  )

  const { products, isLoading } = useProducts()
  await vi.waitUntil(() => !isLoading.value)

  expect(products.value).toEqual([{ id: 1, name: 'Shoe', price: '€19.99' }])
})

it('exposes an error state when the request fails', async () => {
  server.use(http.get('/api/products', () => new HttpResponse(null, { status: 500 })))

  const { error, isLoading } = useProducts()
  await vi.waitUntil(() => !isLoading.value)

  expect(error.value).toBeTruthy()
})
```

```ts
// 👎 Bad — stubs the composable, then asserts the stub. Proves nothing.
it('returns products', () => {
  vi.mock('./useProducts', () => ({
    useProducts: () => ({ products: ref([{ id: 1, name: 'Shoe' }]) }),
  }))

  const { products } = useProducts()

  expect(products.value).toHaveLength(1) // just re-reads the mock
})
```

## 9. Do not write a useless test

If deleting the code leaves the test green, the test is noise. Delete it.

```ts
// 👎 Useless — asserts a constant it supplies; covers no real logic
it('has the right title', () => {
  const title = 'Cart'
  expect(title).toBe('Cart')
})

// 👎 Useless — mount-only, survives deletion of every behavior
it('renders', () => {
  expect(mount(Cart).exists()).toBe(true)
})
```

Write a test only when you can name the one behavior it protects.

## 10. Async, user interaction, and the right query variant

Drive the interaction with `userEvent`, await with `findBy*`, and reserve
`queryBy*` for absence.

```ts
import { userEvent } from '@testing-library/user-event'

// 👏 Good — real user events, findBy for the async result, queryBy for absence
it('shows a validation error when the email is empty', async () => {
  render(SignupForm)

  await userEvent.click(screen.getByRole('button', { name: /sign up/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(/email is required/i)
})

it('shows no error for a valid email', async () => {
  render(SignupForm)

  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
  await userEvent.click(screen.getByRole('button', { name: /sign up/i }))

  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
```

```ts
// 👎 Bad — fireEvent misses handlers, waitFor+getBy is noisier and errors worse,
//          queryBy used to assert presence hides the failure cause
it('shows an error', async () => {
  render(SignupForm)

  fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

  const alert = await waitFor(() => screen.getByRole('alert'))
  expect(screen.queryByRole('alert')).toBeInTheDocument()
})
```

## 11. Match the composable test to its dependency

Reactivity-only composables need no component — invoke and assert.

```ts
// 👏 Good — pure reactivity, tested by direct invocation
import { useCounter } from './useCounter'

it('increments the count', () => {
  const { count, increment } = useCounter()

  increment()

  expect(count.value).toBe(1)
})
```

A composable that uses lifecycle hooks or `inject` runs only inside a component,
so mount it in a minimal host.

```ts
// test-utils.ts — run a composable inside a throwaway component
import { createApp } from 'vue'

export function withSetup<T>(composable: () => T): [T, ReturnType<typeof createApp>] {
  let result!: T
  const app = createApp({ setup() { result = composable(); return () => {} } })
  app.mount(document.createElement('div'))
  return [result, app]
}
```

