# Provider commands

## Project facts

Run this in one shell call. Do not name a variable `path`: in zsh, `path` is tied to `PATH`.

```bash
url=$(git config --get remote.origin.url)
rest=$(printf %s "$url" | sed -E 's#^[a-z+]+://##; s#^[^@/]+@##; s#^altssh\.##')
case "$url" in
  http://*|https://*) proj_host=${rest%%/*}; tail=${rest#*/} ;;
  *://*) proj_host=${rest%%[:/]*}; tail=$(printf %s "${rest#"$proj_host"}" | sed -E 's#^(:[0-9]+)?/##') ;;
  *) proj_host=${rest%%:*}; tail=${rest#*:} ;;
esac
proj_path=${tail%.git}
proj_enc=$(printf %s "$proj_path" | sed 's#/#%2F#g')
proj_key=$(printf %s "$proj_host/$proj_path" | sed 's#/#%2F#g')
echo "$proj_host $proj_path $proj_enc $proj_key"
```

- `git@gitlab.com:group/sub/repo.git` gives the host `gitlab.com`, the path `group/sub/repo`, and the key `gitlab.com%2Fgroup%2Fsub%2Frepo`.
- An HTTP(S) remote keeps an explicit port in the host (`https://gitlab.example.com:8443/group/repo` gives `gitlab.example.com:8443`), because it is the port of the web and API host.
- An `ssh://` remote drops its port, because that port belongs to SSH.
- The key encodes only `/`, and `%` cannot occur in a host or a repository path, so two repositories never get the same key.

## Commands

Use only the column of the provider from the project facts. On a GitHub host other than `github.com` (GitHub Enterprise), add `--hostname <host>` to every `gh api` call and use `-R <host>/<path>` with `gh pr checks`. `<path>` is the project path (`group/sub/repo`), `<enc>` is the URL-encoded path (`group%2Fsub%2Frepo`), and `<host>` is the host. Always pass them explicitly. When the CLI finds the project from the remote, SSH host aliases can break the lookup.

Branch names, file paths, and other values from the provider or the repository can contain shell characters such as `$`, `;`, and `(`. Keep each one in a shell variable and quote it in every command, as the recipes below do (`"$target_branch"`, `"$file"`).

| Operation | GitHub (`gh`) | GitLab (`glab`) |
| --- | --- | --- |
| Current user | `gh api user`, fields `login` and `id` | `glab api --hostname <host> user`, fields `username` and `id` |
| Open PRs (all pages) | `gh api "repos/<path>/pulls?state=open&per_page=100" --paginate --slurp \| jq 'add'` (fields `number`, `head.sha`, `base.ref`, `draft`, `user`, `requested_reviewers`) | `glab api --hostname <host> "projects/<enc>/merge_requests?state=opened&per_page=100" --paginate \| jq -s 'add'` (fields `iid`, `target_branch`, `draft`, `author`, `reviewers`), then `glab api --hostname <host> projects/<enc>/merge_requests/<iid>` for `diff_refs` and `head_pipeline` |
| Head SHA | `head.sha` | `diff_refs.head_sha` |
| Write access | `gh api repos/<path>/collaborators/<login>/permission --jq .permission` is `admin`, `maintain`, or `write` | `glab api --hostname <host> projects/<enc>/members/all/<author id>`, `access_level` is 30 or higher |
| Fork | `head.repo.full_name` is not `base.repo.full_name` (or `head.repo` is null) | `source_project_id` is not `target_project_id` |
| Head commit time (set by the author, see Step 1) | `gh api repos/<path>/commits/<head sha> --jq .commit.committer.date` | `glab api --hostname <host> projects/<enc>/repository/commits/<head sha>`, field `committed_date` |
| PR update time (set by the provider) | `updated_at` of the PR | `updated_at` of the MR |
| Bot author | `user.type` is `Bot` | `author.bot` is true |
| Fetch the head and the target branch | `git fetch origin "+refs/heads/${target_branch}:refs/remotes/origin/${target_branch}" "pull/${number}/head"` (`target_branch` from `base.ref`) | `git fetch origin "+refs/heads/${target_branch}:refs/remotes/origin/${target_branch}" "merge-requests/${iid}/head"` |
| CI of the head SHA | `gh pr checks <number> -R <path> --json name,workflow,state,bucket,link` | `head_pipeline` when its `sha` is the head SHA. Else the pipeline with the highest `id` from `projects/<enc>/pipelines?sha=<head sha>`. Then read all pages of `projects/<enc>/pipelines/<id>/jobs?per_page=100` and of `projects/<enc>/pipelines/<id>/bridges?per_page=100`, each with `--paginate \| jq -s 'add'`. A bridge only triggers a child pipeline: for each bridge with a `downstream_pipeline`, read the jobs and bridges of that pipeline the same way, down to the last level |
| Log of a failed CI job | Only for GitHub Actions jobs, whose link ends in `/actions/runs/<run>/job/<job id>`: `gh api repos/<path>/actions/jobs/<job id>/logs`. Other checks (for example CodeQL) have no log through this call. Record the link only. | `glab api --hostname <host> projects/<enc>/jobs/<job id>/trace` |
| Existing comments | Read all three: inline comments `repos/<path>/pulls/<number>/comments`, general comments `repos/<path>/issues/<number>/comments`, and review bodies `repos/<path>/pulls/<number>/reviews`. Use `gh api --paginate --slurp` for each. | `glab api --hostname <host> "projects/<enc>/merge_requests/<iid>/discussions?per_page=100" --paginate` (discussions include inline and general comments) |

## Review scope

Pipe one PR object from the provider list into this command. It returns `true` when the scope includes the PR. Apply the other selection rules before sorting and limiting the selected PRs. Keep excluded PRs in the report.

```bash
jq --arg provider "$provider" --arg scope "$review_scope" --argjson user "$current_user_id" '
  if $scope == "all" then true
  elif $scope == "exclude-own" then
    (if $provider == "github" then .user.id else .author.id end) != $user
  elif $scope == "assigned" then
    (if $provider == "github" then .requested_reviewers else .reviewers end) as $reviewers
    | if ($reviewers | type) != "array" then error("reviewer data unavailable")
      else any($reviewers[]; .id == $user) end
  else error("invalid review_scope: " + $scope)
  end
'
```

- Use the numeric account ID, not a display name or the git commit author. The provider must already be resolved.
- An empty reviewer array means no direct assignment. A missing or invalid array means unavailable data, not an empty list.
- Do not use `jq -e` here: a valid `false` is an exclusion, not an API failure.
- GitHub's `requested_reviewers` contains pending personal requests. Submitted reviews and `requested_teams` do not count.
- GitLab's `reviewers` contains assigned reviewers. Do not use `assignees` or the `assigned_to_me` scope.

## Things that look like errors

- Read all pages of every list. A list that stops after the first page loses PRs and comments for good, because every run reads the same first page again.
- Do not use `gh pr list` with `--json commits` to get the PRs. With more than about 40 PRs, the query exceeds the GitHub GraphQL node limit and fails.
- `gh api` cannot combine `--slurp` with `--jq`. Pipe the output into `jq` instead.
- `gh pr checks` exits with a code that is not 0 when a check failed or is still pending. Read the JSON, not the exit code.
- When a PR has no CI, `gh pr checks` writes "no checks reported" to stderr and prints no JSON. That means "no CI", not an error.
- `gh run view --job <id> --log-failed` returns HTTP 404 for workflows that the organization requires. The `gh api …/logs` call in the table works for all GitHub Actions jobs.
- `gh api --paginate` and `glab api --paginate` print one JSON array for each page. Use `--slurp` with `gh`, and merge the `glab` pages with `jq -s 'add'`.
- `glab api` exits with 0 on HTTP errors. Read the response.

## Temporary files for a comment

Write a comment body or a payload to a `mktemp` file, never to a fixed name such as `comment.md`. In the PR worktree, a PR can check in that name, or a symlink with that name that points outside the worktree. `mktemp` creates a new private file outside the checkout, and the `trap` removes it also when the post fails.

## Post an inline comment on GitHub

Write the comment body to a temporary file, then post it, in one shell call:

```bash
body_file=$(mktemp); trap 'rm -f -- "$body_file"' EXIT
cat > "$body_file" <<'COMMENT'
<comment with marker>
COMMENT
gh api --method POST "repos/$proj_path/pulls/$number/comments" \
  -F "body=@$body_file" \
  -f commit_id="$head_sha" \
  -f path="$file" \
  -F line="$line" \
  -f side="$side"
```

- `side` is `RIGHT` or `LEFT`. For an added or a context line, use `side=RIGHT` and the line number in the new file.
- For a deleted line, use `side=LEFT` and the line number in the old file. This is the only way to comment on a PR that only deletes code.
- GitHub returns HTTP 422 when the line is not part of the diff. Anchor the comment on a changed line.

## Post an inline comment on GitLab

Build the JSON body with `jq --arg`, so a file path or a comment cannot break the JSON or the shell command. Write it and post it in one shell call:

```bash
body_file=$(mktemp); payload=$(mktemp); trap 'rm -f -- "$body_file" "$payload"' EXIT
cat > "$body_file" <<'COMMENT'
<comment with marker>
COMMENT
jq -n --rawfile body "$body_file" --arg base "$base_sha" --arg start "$start_sha" --arg head "$head_sha" \
  --arg old_path "$old_path" --arg new_path "$new_path" --argjson new_line "$new_line" \
  '{body: $body, position: {position_type: "text", base_sha: $base, start_sha: $start, head_sha: $head,
    old_path: $old_path, new_path: $new_path, new_line: $new_line}}' > "$payload"
glab api --hostname "$proj_host" --method POST "projects/$proj_enc/merge_requests/$iid/discussions" \
  -H "Content-Type: application/json" --input "$payload"
```

- `base_sha`, `start_sha`, and `head_sha` come from `diff_refs`.
- `old_path` and `new_path` come from the diff of the file. They differ for a renamed file, and GitLab rejects or misplaces the comment when both carry the new path.
- For an added line, set `new_line`. For a deleted line, set `old_line` instead. For a context line, set both.
- `-f position[...]` flags are silently dropped, and the comment then lands as a general comment. Always send JSON.

- Without the `Content-Type` header, GitLab returns HTTP 415.
- Check that the response has a `position` that is not null. Before a retry, read the discussions again, so you do not post the same comment twice.

## Post the round note

Write the note to a temporary file, then post it in one shell call. `event` is `APPROVE` or `COMMENT` (see step 9).

GitHub (one review that carries the note and the approval):

```bash
body_file=$(mktemp); trap 'rm -f -- "$body_file"' EXIT
cat > "$body_file" <<'NOTE'
<note with marker>
NOTE
gh api --method POST "repos/$proj_path/pulls/$number/reviews" \
  -F "body=@$body_file" \
  -f event="$event" \
  -f commit_id="$head_sha"
```

- Check that the response `state` is `APPROVED` or `COMMENTED`. HTTP 422 on `APPROVE` means the current user opened the PR: post the note with `event=COMMENT` instead.

GitLab (a note, and for an approval also the approve call):

```bash
body_file=$(mktemp); payload=$(mktemp); trap 'rm -f -- "$body_file" "$payload"' EXIT
cat > "$body_file" <<'NOTE'
<note with marker>
NOTE
jq -n --rawfile body "$body_file" '{body: $body}' > "$payload"
glab api --hostname "$proj_host" --method POST "projects/$proj_enc/merge_requests/$iid/notes" \
  -H "Content-Type: application/json" --input "$payload"
# Only for an approval:
glab api --hostname "$proj_host" --method POST "projects/$proj_enc/merge_requests/$iid/approve" -f sha="$head_sha"
```

- `sha` makes GitLab refuse the approval (HTTP 409) when the head moved since the review. Then leave the note, and let the next run review the new head.
- `glab api` exits with 0 on HTTP errors. Read both responses.
