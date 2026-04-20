---
name: repo-diagnostics
description: Run git-based diagnostics on a repository before reading any code. Reveals churn hotspots, bus factor, bug-clustering, commit velocity, and crisis patterns. Use this when starting work on an unfamiliar codebase, onboarding to a repo, or auditing technical health.
argument-hint: "[path to repo or leave blank for current directory]"
---

# Repository Intelligence

Run five git diagnostics that give a structural picture of a codebase before opening any files. Work through each command in order, capture the output, and then synthesise the results into a short findings summary.

## Step 1 — What changes the most (churn hotspots)

```bash
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20
```

List the 20 most-modified files in the last year. High churn signals active development or, more often, codebase drag: files that accumulate patches instead of proper fixes. Cross-reference this list against Step 3 (bug clusters). A file that ranks high on both lists is the single biggest risk in the repo.

## Step 2 — Who built this (bus factor)

```bash
git shortlog -sn --no-merges
```

Rank contributors by total commit count. If one person accounts for ≥60 % of commits, note it as a bus-factor risk. Then run the same command scoped to the last six months to see whether that person is still active:

```bash
git shortlog -sn --no-merges --since="6 months ago"
```

If the top historical contributor does not appear in the recent window, flag it. Also check the tail: many contributors but only a handful active recently means the people who built the system are not the people maintaining it.

> Note: squash-merge workflows compress authorship. If the team squashes every PR, this reflects who merged, not who wrote. Check the merge strategy before drawing conclusions.

## Step 3 — Where do bugs cluster (bug hotspots)

```bash
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

The 20 files most frequently touched in bug-fix commits. Effectiveness depends on commit message discipline—if the team writes "update stuff" everywhere, this will return little signal. Even a rough map is useful. Cross-reference against Step 1.

## Step 4 — Is the project accelerating or dying (commit velocity)

```bash
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c
```

Commit count by calendar month for the full history. Interpret the shape:
- Steady rhythm → healthy cadence
- Count dropping by half in a single month → someone likely left
- Declining curve over 6–12 months → team losing momentum
- Periodic spikes then silence → batch/release model rather than continuous shipping

## Step 5 — How often is the team firefighting (crisis frequency)

```bash
git log --oneline --since="1 year ago" | grep -iE 'revert|hotfix|emergency|rollback'
```

Revert and hotfix frequency over the past year. A handful is normal. Reverts every few weeks signals that the team does not trust its deploy process. Zero results means either stability or undisciplined commit messages—clarify which before concluding.

## Synthesis

After running all five commands, produce a concise findings summary with the following structure:

1. **Churn hotspots** – top 3–5 files with note on whether they also appear in bug clusters
2. **Bus factor** – primary author(s), whether they are still active, health of contributor spread
3. **Bug magnets** – files that appear in both churn and bug-fix lists (highest-risk code)
4. **Velocity trend** – one-line description of the commit-velocity shape
5. **Crisis signal** – count and pattern of reverts/hotfixes; interpretation
6. **Recommended first reads** – which files or areas to examine first, based on all of the above

Keep the summary to one paragraph per section. Flag only what is genuinely anomalous; do not pad with reassurances about healthy signals.
