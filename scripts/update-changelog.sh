#!/bin/bash
# Auto-update CHANGELOG.md with recent commits since last tag.
# Called by pre-push git hook.

set -e

CHANGELOG="CHANGELOG.md"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
DATE=$(date +%Y-%m-%d)

if [ -z "$LAST_TAG" ]; then
  RANGE="HEAD"
else
  RANGE="${LAST_TAG}..HEAD"
fi

# Get conventional commit messages grouped by type
FEATS=$(git log "$RANGE" --pretty=format:"- %s" --grep="^feat" 2>/dev/null || true)
FIXES=$(git log "$RANGE" --pretty=format:"- %s" --grep="^fix" 2>/dev/null || true)
OTHERS=$(git log "$RANGE" --pretty=format:"- %s" --grep="^refactor\|^perf\|^chore\|^docs" 2>/dev/null || true)

# Only proceed if there are new commits
if [ -z "$FEATS" ] && [ -z "$FIXES" ] && [ -z "$OTHERS" ]; then
  exit 0
fi

# Get changed files summary
DIFF_STAT=$(git diff --stat "$RANGE" -- src/ 2>/dev/null | tail -1 || true)

# Build entry
ENTRY="## Unreleased ($DATE)\n"

if [ -n "$FEATS" ]; then
  ENTRY="${ENTRY}\n### Features\n${FEATS}\n"
fi
if [ -n "$FIXES" ]; then
  ENTRY="${ENTRY}\n### Fixes\n${FIXES}\n"
fi
if [ -n "$OTHERS" ]; then
  ENTRY="${ENTRY}\n### Other\n${OTHERS}\n"
fi
if [ -n "$DIFF_STAT" ]; then
  ENTRY="${ENTRY}\n### Diff\n\`${DIFF_STAT}\`\n"
fi

# Prepend to CHANGELOG (after first line which is "# Changelog")
if [ -f "$CHANGELOG" ]; then
  # Insert after the "# Changelog" header
  HEAD=$(head -1 "$CHANGELOG")
  TAIL=$(tail -n +2 "$CHANGELOG")
  printf "%s\n\n%b\n%s" "$HEAD" "$ENTRY" "$TAIL" > "$CHANGELOG"
else
  printf "# Changelog\n\n%b\n" "$ENTRY" > "$CHANGELOG"
fi

git add "$CHANGELOG"
echo "[a11yer] CHANGELOG.md updated"
