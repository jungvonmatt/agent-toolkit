<!-- Keep this file identical in every skill that has it. npm test checks the copies and the pinned version. -->

# modern-web-guidance

[`modern-web-guidance`](https://github.com/GoogleChrome/modern-web-guidance) holds guides by the Chrome, Edge, Firefox, and MDN teams: native platform features, accessible patterns, and the fallbacks each one needs. Use it for HTML, CSS, and client-side JavaScript.

## Run the CLI

Run the pinned version through `npx`, from the project checkout, so the CLI reads the project's `.mwgrc`. It needs no installation and leaves the project unchanged.

```bash
DISABLE_TELEMETRY=1 npx -y modern-web-guidance@1.0.1 search "<query>"
DISABLE_TELEMETRY=1 npx -y modern-web-guidance@1.0.1 retrieve "<id>,<id>"
```

- **Pinned version.** Use exactly this version, also when the companion skill is installed. A new release reaches our skills only when someone raises the version here.
- **`DISABLE_TELEMETRY=1`** keeps queries and guide IDs on the machine. Without it, the CLI sends them to Google, and our queries come from client work.
- **Large output.** `retrieve` writes output above about 9.5 KB to a temporary file and prints its path. Read that file in full.
- **Failure.** The CLI needs Node.js 22 or later. When a command fails, record `unavailable — <reason>` and continue without the guide. Cite only guides you retrieved in this run.

## Write the query

Name one platform capability or UI pattern in 2–5 generic English words, for example `light dismiss dialog` or `responsive data table`.

- Use platform words only: `close the checkout modal in React` becomes `light dismiss dialog`. The query carries no framework, product, client, or component name.
- Name the UI primitive the task implies: "confirm before delete" becomes `confirmation dialog`, "pick a date" becomes `date picker input`.
- Search once per capability. Split a task with several features into several searches.
- Judge the results by their `description`. When none fits, rephrase once with a concrete HTML or CSS noun (`dialog`, `popover`, `table`, `form`). When none fits after that, the topic is not covered: continue without a guide.
- Also retrieve the discipline guide the work touches: `accessibility`, `color`, `css`, `forms`, `html`, `js`, `performance`, or `security`.

## Browser support

Each guide names fallbacks for features that are not Baseline Widely available. Apply them unless the project target already covers the feature. The project target is the first of:

1. `"baseline"` in `.mwgrc` at the repository root: `widely`, `newly`, `limited`, or a year such as `2024`. `retrieve` then opens each guide with a "Project Baseline Target" note. Follow it.
2. `browserslist` (in `package.json` or `.browserslistrc`), or a browser support policy in `AGENTS.md`, `CLAUDE.md`, or another agent context file.
3. Baseline Widely available.

For a year target, a feature fits when its "Baseline since" date is in that year or earlier.

`DISABLE_TELEMETRY=1 npx -y modern-web-guidance@1.0.1 set-baseline <widely|newly|limited|year>` records the target in `.mwgrc` for every agent. The CLI help does not list this command yet. Run it only after the developer agrees.

## Gated guides

`retrieve` holds back guides for Origin Trial APIs and volatile features (shipped in one browser engine, or still changing) until the project opts in. It then exits with an error and prints a notice that starts with `[!CAUTION]`. That is a gate, not a tool failure:

- Record `gated: <id>` where you would cite the guide.
- Build or recommend a standard cross-browser solution. Use the gated feature only when the developer named that exact API.
- The opt-in belongs to the developer: name the command from the notice and leave it to them.
