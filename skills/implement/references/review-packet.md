# Review Packet

The review packet is what the executor presents at the **pre-commit human gate**. In default mode the gate fires for every task; in `auto` mode it fires only at the plan's review gates, risk triggers, and `[TENTATIVE]` confirmations.

The change stays in the working tree — staged or unstaged, **never committed**. The packet is a short summary that points the reviewer at the live diff; it does not replace the diff. The reviewer reads the real lines in their own tool (VS Code, a diff viewer, `git diff`), then approves or requests changes. The commit follows only after approval.

Keep the packet short. It orients the reviewer; it is not a report.

## Template

```markdown
### Review — Task <N>: <title>

**Acceptance criteria** (the bar for this task):
- [ ] <criterion 1>
- [ ] <criterion 2>

**Files changed** (read the working-tree diff for the detail):
- `<path>` — <one-line summary of the change>
- `<path>` — <one-line summary of the change>

**Verification:**
- Tests: <new test name(s)> — fail without the change, pass with it
- Suite: <pass / N passed, 0 failed>
- Build: <pass / fail>
- Runtime: <what was checked and where — dev server, Storybook, the command>

**Needs a decision:** (omit when nothing is open)
- Resolved `[TENTATIVE]`: <decision> → <what was chosen and why>
- Deviation from the plan: <what and why>
- Edge case handled differently: <what and why>

**Proposed commit:** `<type>(scope): <description>`

> Review the working-tree diff, then reply `approve` to commit, or request changes.
```

## Rules

- Present the packet **before** the commit, with the change in the working tree.
- List only the files this task touched. If more changed, the task drifted out of scope — flag it.
- Name the test that fails without the change. "Tests pass" alone does not prove new behavior.
- Surface every resolved `[TENTATIVE]` decision and every deviation from the plan — do not hide them in the diff.
- Wait for an explicit `approve` (or equivalent). Treat a hedged reply as **not** approved.
- On "changes requested", apply the changes, re-verify, and present the packet again. Do not commit until approved.
- After approval, stage only the files this task touched plus its status update. Never `git add -A` blindly.
