# Providers

How to resolve a ticket read-only across providers, and the normalized shape every provider maps into.

Pick the provider from the user's input:

- Key like `PROJ-123`, or an `atlassian.net/browse/...` URL → **Jira**
- `linear.app/...` URL or `ENG-123`-style key with a Linear workspace → **Linear**
- `app.asana.com/...` URL or a task GID → **Asana**
- `github.com/<org>/<repo>/issues/<n>` or `#<n>` in a GitHub repo → **GitHub Issues**
- `gitlab.com/.../-/issues/<n>` or `#<n>` in a GitLab repo → **GitLab Issues**

Always fetch read-only. Never edit, comment on, transition, or assign the ticket.

## Normalized ticket shape

Every provider maps into this. Leave a field empty if the provider has no equivalent.

```text
id                  provider key or number (e.g. PROJ-123, #42)
url                 canonical link
title               one-line summary
description         full body
acceptance_criteria consolidated from description + comments
comments            oldest → newest (refinement decisions live here)
labels              labels / components / tags
links              linked/related/blocking issues, sub-tasks
attachments         design links, screenshots, files
```

## Jira

Prefer the Atlassian MCP tools if configured; otherwise the user pastes content.

- Fetch the issue by key/URL → title, description, status, labels, components, story points, priority.
- Fetch all comments (oldest → newest).
- Fetch linked issues and sub-tasks.
- Map issue links + remote links into `links`/`attachments`.

## Linear

Prefer the Linear MCP tools if configured.

- Fetch the issue by identifier/URL → title, description, state, labels, estimate, priority.
- Fetch comments (oldest → newest) and linked/related issues.

## Asana

Prefer the Asana MCP tools if configured.

- Fetch the task by GID/URL → name, notes (description), assignee, custom fields.
- Fetch stories/comments (oldest → newest) and subtasks.
- Treat the task `notes` as the description; custom fields may hold acceptance criteria.

## GitHub Issues

Prefer the `gh` CLI (read-only). Example:

```bash
gh issue view <number> --json title,body,labels,comments,url,milestone
```

- Body → description; labels → labels; comments → comments.
- Follow task-list checkboxes and linked issues/PRs into `links`.

## GitLab Issues

Prefer the `glab` CLI (read-only). Example:

```bash
glab issue view <number> --comments
```

- Description → description; labels → labels; notes → comments.
- Follow related issues and linked MRs into `links`.

## Fallback

If no provider integration is available, ask the user to paste the ticket title, description, acceptance criteria, and relevant comments. Do not guess ticket contents.
