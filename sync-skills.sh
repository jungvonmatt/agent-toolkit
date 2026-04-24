#!/usr/bin/env bash
set -euo pipefail

SKILLS_SRC="$(cd "$(dirname "$0")/skills" && pwd)"
SKILLS_DEST="$HOME/.agents/skills"

echo "Syncing skills from $SKILLS_SRC to $SKILLS_DEST..."

mkdir -p "$SKILLS_DEST"

for skill_dir in "$SKILLS_SRC"/*/; do
  skill_name="$(basename "$skill_dir")"
  dest="$SKILLS_DEST/$skill_name"
  rsync -a --delete "$skill_dir" "$dest/"
  echo "  synced: $skill_name"
done

echo "Done."
