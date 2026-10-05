# Provider commands

Use only the column of the provider from the project facts. `<path>` is the project path (`group/sub/repo`), `<enc>` is the URL-encoded path (`group%2Fsub%2Frepo`), and `<host>` is the host. Always pass them explicitly. When the CLI finds the project from the remote, SSH host aliases can break the lookup.

| Operation | GitHub (`gh`) | GitLab (`glab`) |
| --- | --- | --- |
| Current user | `gh api user --jq .login` | `glab api --hostname <host> user`, field `username` |
| Open PRs (all pages) | `gh api "repos/<path>/pulls?state=open&per_page=100" --paginate --slurp \| jq 'add'` (fields `number`, `head.sha`, `base.ref`, `draft`, `user`) | `glab api --hostname <host> "projects/<enc>/merge_requests?state=opened&per_page=100" --paginate \| jq -s 'add'` (fields `iid`, `target_branch`, `draft`, `author`), then `glab api --hostname <host> projects/<enc>/merge_requests/<iid>` for `diff_refs` and `head_pipeline` |
| Head SHA | `head.sha` | `diff_refs.head_sha` |
| Head commit time | `gh api repos/<path>/commits/<head sha> --jq .commit.committer.date` | `glab api --hostname <host> projects/<enc>/repository/commits/<head sha>`, field `committed_date` |
| Bot author | `user.type` is `Bot` | the username names a bot, for example `dependabot`, `renovate-bot`, or `project_123_bot_…` |
| Fetch the head and the target branch | `git fetch origin <base.ref> pull/<number>/head` | `git fetch origin <target_branch> merge-requests/<iid>/head` |
| CI of the head SHA | `gh pr checks <number> -R <path> --json name,workflow,state,bucket,link` | `head_pipeline` when its `sha` is the head SHA. Else the pipeline with the highest `id` from `projects/<enc>/pipelines?sha=<head sha>`. Then read all pages of `projects/<enc>/pipelines/<id>/jobs?per_page=100` and of `projects/<enc>/pipelines/<id>/bridges?per_page=100` (downstream pipelines), each with `--paginate \| jq -s 'add'` |
| Log of a failed CI job | Only for GitHub Actions jobs, whose link ends in `/actions/runs/<run>/job/<job id>`: `gh api repos/<path>/actions/jobs/<job id>/logs`. Other checks (for example CodeQL) have no log through this call. Record the link only. | `glab api --hostname <host> projects/<enc>/jobs/<job id>/trace` |
| Existing comments | Read all three: inline comments `repos/<path>/pulls/<number>/comments`, general comments `repos/<path>/issues/<number>/comments`, and review bodies `repos/<path>/pulls/<number>/reviews`. Use `gh api --paginate --slurp` for each. | `glab api --hostname <host> "projects/<enc>/merge_requests/<iid>/discussions?per_page=100" --paginate` (discussions include inline and general comments) |

## Things that look like errors

- Read all pages of every list. A list that stops after the first page loses PRs and comments for good, because every run reads the same first page again.
- Do not use `gh pr list` with `--json commits` to get the PRs. With more than about 40 PRs, the query exceeds the GitHub GraphQL node limit and fails.
- `gh api` cannot combine `--slurp` with `--jq`. Pipe the output into `jq` instead.
- `gh pr checks` exits with a code that is not 0 when a check failed or is still pending. Read the JSON, not the exit code.
- When a PR has no CI, `gh pr checks` writes "no checks reported" to stderr and prints no JSON. That means "no CI", not an error.
- `gh run view --job <id> --log-failed` returns HTTP 404 for workflows that the organization requires. The `gh api …/logs` call in the table works for all GitHub Actions jobs.
- `gh api --paginate` and `glab api --paginate` print one JSON array for each page. Use `--slurp` with `gh`, and merge the `glab` pages with `jq -s 'add'`.
- `glab api` exits with 0 on HTTP errors. Read the response.

## Post an inline comment on GitHub

Write the comment body to a file, then post it:

```bash
gh api --method POST "repos/<path>/pulls/<number>/comments" \
  -F body=@comment.md \
  -f commit_id=<head sha> \
  -f path=<file> \
  -F line=<line> \
  -f side=<RIGHT or LEFT>
```

- For an added or a context line, use `side=RIGHT` and the line number in the new file.
- For a deleted line, use `side=LEFT` and the line number in the old file. This is the only way to comment on a PR that only deletes code.
- GitHub returns HTTP 422 when the line is not part of the diff. Anchor the comment on a changed line.

## Post an inline comment on GitLab

Send a JSON body with a nested `position` object:

```json
{
  "body": "<comment with marker>",
  "position": {
    "position_type": "text",
    "base_sha": "<diff_refs.base_sha>",
    "start_sha": "<diff_refs.start_sha>",
    "head_sha": "<diff_refs.head_sha>",
    "old_path": "<file>",
    "new_path": "<file>",
    "new_line": 42
  }
}
```

- For an added line, set `new_line`. For a deleted line, set `old_line`. For a context line, set both.
- `-f position[...]` flags are silently dropped, and the comment then lands as a general comment. Always send JSON.

```bash
cat payload.json | glab api --hostname <host> --method POST "projects/<enc>/merge_requests/<iid>/discussions" \
  -H "Content-Type: application/json" --input -
```

- Without the `Content-Type` header, GitLab returns HTTP 415.
- Check that the response has a `position` that is not null. Before a retry, read the discussions again, so you do not post the same comment twice.
