# Code comments

The code says **what** and **how**. A comment says **why**, or states the contract that the code cannot. Write a comment only when a reader who knows the language, but not your context, cannot recover the information from the code. When no rule below fires, the code stands alone.

## Decide: comment or not

Take the first rule that matches:

1. **It describes your change** ("now handles", "changed X to Y", "fixed", "added", "new version"): it goes in the commit message or the PR description.
2. **It restates the code, the name, the signature, or the types:** no comment.
3. **A rename, an extracted function, a named constant, or a type can carry it:** change the code instead.
4. **It is an exported or public API, or a function other modules call, and name plus signature leave the contract unclear:** write a doc comment (see [Doc comments](#doc-comments)).
5. **The reader cannot recover it from the code:** write an inline comment (see [Inline comments](#inline-comments)).
6. **Anything else:** no comment.

Tie-breaker: if you would have to explain it in the code review, comment it now.

## Inline comments

An inline comment earns its place when it carries one of these:

- **Why** this approach, or why not the obvious alternative.
- **A constraint** from outside the code: an API limit, a spec, a legal rule.
- **A warning** of consequences: "Runs on every keystroke, so keep it cheap."
- **Precision** the type cannot carry: units, inclusive or exclusive bounds, what `null` or `-1` means.
- **A workaround:** the upstream bug, its link, and the condition for removal.
- **Unidiomatic code** that looks like a bug but is deliberate.
- **A source:** the RFC, the spec section, or the origin of copied code.
- **A regex or format** explained in words.
- **A TODO** with a ticket and a specific action.

Shape:

- One line. Three lines at most. A reason that needs more belongs in a doc comment, an ADR, or a better name.
- Place it directly above the line it concerns.
- Describe the code as it stands. Your edit, the session, and the author belong in version control.
- Use words the identifiers do not already use.
- Follow the project's TODO format. Without one, write `TODO(PROJ-123): <specific action>`. A task you can finish now needs no TODO: do it.

```ts
// Stripe rejects amounts above 99,999,999 minor units, so split larger orders.
const chunks = splitAmount(totalCents, 99_999_999)

// Workaround for PROJ-812 (Safari fires `resize` before layout).
// Remove when Safari 17.4 leaves the browser support matrix.
requestAnimationFrame(measure)
```

## Doc comments

**Who gets one:** every exported or public member whose contract is not obvious from name and signature, and internal functions other modules call on the same terms. Skip self-explanatory members (a doc comment that could only say "the foo"), overrides that keep the parent's contract, and private helpers with clear names.

Write the doc comment when you write the signature. When it is hard to write, or must be long to be complete, the name or the design is the problem: fix that first.

**Content,** in this order:

1. **Summary:** one line of at most 80 characters, a verb phrase that says more than the name: "Sums line totals in minor units, after line discounts." It starts with the verb, never "This function".
2. **Only what the signature cannot say:**
   - preconditions and valid ranges
   - units and bounds
   - `null`, `undefined`, and empty-input behavior, and special return values
   - side effects, I/O, and mutation of arguments
   - errors thrown, and when
   - thread-safety, blocking, cost, and ordering guarantees callers rely on
   - an example, when correct use is not obvious
3. **Deprecation:** what replaces it and since when.

**Caller test:** a caller can use the function correctly without reading its body. The implementation (the algorithm, the helper calls) stays out of the doc comment: it changes, and the contract does not. Put the reasoning as an inline comment at the tricky line.

```ts
/**
 * Sums line totals in minor units (cents), after line discounts.
 *
 * @throws {CurrencyMismatchError} If an item uses a currency other than `currency`.
 */
export function totalPrice(items: CartItem[], currency: Currency): number {
```

## Conventions by language

Match the project first: read the nearby doc comments and the linter config. Use the table when the project gives no signal.

| Ecosystem | Summary voice | Types in the doc | Tags |
|---|---|---|---|
| **TSDoc / JSDoc in `.ts`** | Third person: "Returns …" | Never: the signature has them | `@param name - desc` only when it adds information. `@returns` only when the summary does not say it. `@throws`, `@example`, `@deprecated`, `@remarks` for detail after the summary. |
| **JSDoc in `.js`** | Third person | `{Type}` when the project type-checks JS (`checkJs`): the JSDoc types are the type system | As above. |
| **Javadoc** | Third person, a fragment: "Returns the customer ID." | No | Order: `@param`, `@return`, `@throws`, `@deprecated`. `@throws` for checked exceptions and unchecked ones a caller may catch. |
| **KDoc** | Third person | No | Avoid `@param` and `@return`. Work parameters into the prose as `[param]` links. Deprecate with the `@Deprecated` annotation. |
| **Python docstrings** | Imperative (PEP 257): "Return …" | Only when not annotated | Google style `Args:`, `Returns:`, `Raises:`. Drop sections a one-line docstring covers. |
| **PHPDoc** | Follow the project | Only what native types cannot say: `array<int, User>`, `list<string>`, shapes, `@template` | Omit tags that repeat the name or the native type. Omit `@return void`. |

Keep one voice per file. When a linter demands a tag (`require-param`, Javadoc on every member), fill it with real information (units, range, meaning) rather than an echo of the name.

## Keep comments true

- Fix every comment and doc comment your change made false, in the same change. Code changes that leave comments inconsistent are about 1.5 times more likely to introduce a bug ([Radmanesh et al. 2024](https://arxiv.org/abs/2409.10781)).
- Leave a colleague's comment that is still true as it is, even when you would phrase it differently.
- Document a decision that spans modules once (in design notes or an ADR) and point to it from each site.

## Revise: over-commenting patterns

Agents over-comment. Sweep every comment you wrote against this table:

| Pattern | Fix |
|---|---|
| Narration: `// Loop over the users` | Delete. Extract a named function when a block needs a label. |
| Change log: `// Now handles null`, `// Fixed the bug where …` | Move to the commit message. Keep only a constraint that remains. |
| Session talk: `// As requested`, `// Improved version` | Delete. |
| Echo tags: `@param userId - The user ID`, `@returns The result` | Delete, or state the format, range, or edge case. |
| Types in JSDoc in a `.ts` file: `@param {string} name` | Remove the type. |
| A paragraph on a getter or a three-line helper | One line or nothing. |
| A doc comment that narrates the algorithm | State the contract. Move the reasoning to the tricky line. |
| "This function …", "Helper that …" | Start with the verb. |
| Section banners, `// end if` | Delete. Split the file or the function. |
| Commented-out code | Delete. Git keeps it. |
| Bare `// TODO: add error handling` | Do it now, or add the ticket and the action. |
| Empty emphasis: `// Important!`, `// Note: needed` | State the consequence, or delete. |
| Hedges: `// Might be needed` | Verify, then state the fact or delete. |
| Author, date, or "Generated by" headers | Delete. Keep license headers. |
| The same explanation at the definition and every call site | Keep it once, at the definition. |

## Checklist

- [ ] Every comment passed the decision rules: it says why, a constraint, or the contract.
- [ ] No comment describes the edit, the session, or the author.
- [ ] Every exported member with a non-obvious contract has a doc comment that passes the caller test.
- [ ] Every doc summary is one line and says more than the name.
- [ ] No tag repeats the name or a type the signature already has.
- [ ] Every comment the change made false is fixed.
