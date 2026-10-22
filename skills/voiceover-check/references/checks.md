# VoiceOver Checks by Component

Choose the sections for the component under test in Step 2, before VoiceOver starts. Run the Browser checks only in Step 7, after VoiceOver is off. Each row names what a screen reader user must hear, how to check it, the WCAG 2.2 criterion, and the usual cause of a failure. "Practice" marks a common expectation that is not a WCAG criterion.

How to check:

- **VO**: with `scripts/vo.sh` (`walk`, `seek`, `act`, `do`).
- **Browser**: with the browser automation you control (accessibility snapshot, `evaluate_script`), after VoiceOver is off and before closing the test instance. Inspect the same tab and state.

A blocked or interrupted attempt is not a failed page check. Use the execution and repetition rules in Step 6 of [../SKILL.md](../SKILL.md): one valid run per distinct scenario by default. Record actual valid/planned, successful, failed, and blocked counts. Missing planned observations mean incomplete. A valid observed failure remains a finding even if a follow-up passes. Missing targets or `(no move)` require a context check, not an automatic failure.

## Page

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| The page title names the page and, in an app, the current view | VO: the title spoken when entering the web area (Step 3) and after a client-side route change | 2.4.2 | Same `<title>` on every route, not updated after SPA navigation |
| VoiceOver reads the page in its language: the right voice, the right pronunciation | Browser: `document.documentElement.lang`; VO: listen | 3.1.1, 3.1.2 | `lang` missing or wrong, or a part in another language without its own `lang` |
| Headings form an outline and skip no level | VO: discover heading commands, then `do`; Browser: snapshot afterward | 1.3.1, 2.4.6 | Headings chosen for their size, text styled as a heading |
| Main content and navigation sit in landmarks | VO: discover landmark commands, then `do`; Browser: snapshot afterward | 1.3.1 | `div` instead of `main`, `nav`, `header`, `footer` |
| A skip link, when present, is among the first items and moves the cursor to the main content | VO: `walk` from the top, `act` on it, then `last` | 2.4.1 | Target without an `id` or not focusable, link hidden with `display: none` |
| The reading order follows the visual order | VO: `walk`, compared with a screenshot | 1.3.2, 2.4.3 | CSS `order`, absolute positioning, DOM order unlike the layout |

## Images and icons

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| An informative image says what it shows or does, not its file name | VO | 1.1.1 | `alt` missing, file name or "image" as `alt` |
| A decorative image or icon is silent | VO: `walk` past it | 1.1.1 | `alt` missing instead of `alt=""`, inline SVG without `aria-hidden="true"` |
| An image inside a link or button is not read in addition to the control's name | VO | 1.1.1, Practice | Icon `alt` repeats the visible text |

## Buttons, links, and other controls

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| Every control has a name that says its purpose, icon-only controls too | VO | 4.1.2, 2.4.6 | Icon without text or `aria-label` |
| The role fits the behavior: a link goes somewhere, a button does something | VO | 4.1.2 | `a` without `href`, `div` with a click handler |
| The name is short; longer text is a description | VO | 2.4.6 | A whole paragraph inside the `label` |
| Each text is read once | VO | Practice | Visible text and a label both exposed, a label repeated as plain text |
| No item is silent or empty | VO: `(empty phrase)` lines, or a hint where an item should be | 1.3.1 | An empty container, for example an error container rendered without an error |
| A link that opens a new tab or window, or downloads a file, says so | VO | 3.2.5 (AAA), Practice | `target="_blank"` with only a visual icon |

## Dialog

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| On open, VoiceOver says the dialog's name and role, and the cursor is inside it | VO: `act` on the control that opens it | 4.1.2, 2.4.3 | No `aria-labelledby`, focus not moved into the dialog |
| The cursor stays inside: walking past the last item never reaches the page behind the dialog | VO: `walk` until a few items past the end of the dialog | 2.4.3, 1.3.2 | No `showModal()`, no `aria-modal="true"`, background not `inert` |
| Escape closes the dialog | VO: `do "<app>" "escape"`; the next phrase names the control that opened it | Practice (WAI-ARIA dialog pattern) | No key handler on a custom dialog |
| On close, focus returns to the control that opened it | VO: `act` on the close button; the next phrase names that control | 2.4.3 | Focus not restored, or sent to the top of the page |
| A control says it opens a dialog only when it does | VO | 4.1.2 | Wrong `aria-haspopup` value |

## Form

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| Every field says its label, its role, and "required" when it is required | VO | 1.3.1, 3.3.2, 4.1.2 | Placeholder as the label, `required` missing |
| No field says "invalid" before the user typed or submitted | VO: `walk` on a freshly loaded form | 4.1.2, 3.3.1 | `aria-invalid="true"` in the markup, or set from `:invalid` instead of `:user-invalid` |
| After a failed submit, focus moves to the first invalid field and VoiceOver reads its error | VO: `act` on the submit button | 3.3.1 | No focus move, or focus on the form or the top of the page |
| Each error is read with its field, once | VO | 3.3.1, 1.3.1 | No `aria-describedby` or `aria-errormessage`; `role="alert"` inside an `aria-live` region reads it twice |
| With several errors, the number of errors is announced | VO | Practice | No error summary |
| A successful submit is announced | VO: `act` in the success scenario | 4.1.3 | Success text shown without a live region or a focus move |

## Live region, toast, and status message

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| The message is announced after the intended action | VO: `act`; record valid attempts and collection limits | 4.1.3 | The region is added together with its text, so VoiceOver does not see a change |
| Only critical, time-sensitive messages interrupt (`assertive`, `role="alert"`); others wait (`polite`, `role="status"`) | Browser: attribute; VO: listen | 4.1.3 | `assertive` for routine messages |
| The message survives a focus move at the same moment | VO: `act` | 4.1.3 | Announcement and focus move at once; a delay of about 1 s helps |
| The same message twice is announced twice | VO: `act` twice | 4.1.3 | The region is not cleared before the new text |
| The message is not written into content that is inert or hidden, for example behind an open dialog | Browser | 4.1.3 | One page-level region used while a modal dialog is open |
| "Loading…" and similar states are announced only when they help | VO | Practice | A live region on every state change |

## Menu, disclosure, and popup

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| The control says collapsed or expanded, and the state changes after activation | VO: `act`, then `last` | 4.1.2 | `aria-expanded` missing or not updated |
| The popup type matches what opens: menu, listbox, or dialog | VO; Browser: `aria-haspopup` | 4.1.2 | `aria-haspopup` copied from another control |
| After opening, the popup is reachable in a meaningful order | VO: confirm activation and expanded state, check group interaction, then `walk` or a suitable `do` within scope | 2.4.3, 1.3.2 | Focus or reading order separates the popup from its trigger; non-adjacency alone does not prove inaccessibility |

## Tabs

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| Each tab says its name, the role tab, its position ("2 of 3"), and whether it is selected | VO | 4.1.2 | Buttons or links styled as tabs, no `role="tablist"` parent, `aria-selected` missing |
| Activating a tab updates the selected state, and the next item is its panel content | VO: `act`, then `last` and `walk` | 4.1.2, 1.3.2 | `aria-selected` not updated, panel rendered far from the tab list |
| Arrow keys move between tabs and only the active tab is in the Tab order | Browser: keyboard after VoiceOver is off | Practice (WAI-ARIA tabs pattern) | Every tab has `tabindex="0"`, no arrow-key handler |

## Data table

| Check | How | WCAG | Usual cause |
| --- | --- | --- | --- |
| The table is announced as a table with its size and, when present, its caption | VO | 1.3.1 | Layout with `div` grids, `role="presentation"` on a data table |
| Moving between cells reads the column header (and row header where one exists) | VO: discover table commands, then `do` | 1.3.1 | `td` used for headers, `th` without `scope` in complex tables |

## Not covered by this skill

Color contrast, target size, zoom and reflow, reduced motion, and visible focus need no screen reader. Use the `a11y-debugging` or `accessibility` skill for them.

Other screen readers (NVDA, JAWS, TalkBack, VoiceOver on iOS) interpret the same markup differently, for example NVDA's browse and focus modes. A VoiceOver pass does not prove them. When the change targets custom widgets or live regions, name them as untested in the report.

## Severity

Use the same impact levels as the `accessibility` skill:

| Level | Meaning | Example |
| --- | --- | --- |
| Critical | A screen reader user cannot finish the task | An unnamed submit button; a form error that is never announced |
| Serious | The task is possible, but the user is misled or loses their place | The cursor leaves a modal dialog; fields say "invalid" before any input; focus is not restored |
| Moderate | Extra effort or noise | A text read twice; a very long name; empty stops |
| Minor | A best practice, not a WCAG failure | No error count with several errors |

## Fix guidance

When the `modern-web-guidance` skill is present, find the fix there and name the guide in the finding. Search first and retrieve the IDs it returns; do not guess IDs:

```bash
npx -y modern-web-guidance@latest search "announce form errors only after user interaction"
npx -y modern-web-guidance@latest retrieve "<id>"
```

Useful searches: "announce form errors only after user interaction", "modal dialog inert background", "accessible live region announcements", "toast notifications", "dialog close and focus".

Prefer its error-handling guide over patterns that put `aria-invalid="true"` in the markup or nest `role="alert"` inside an `aria-live` region. Those patterns cause "invalid" before any input and double announcements.
