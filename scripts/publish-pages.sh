#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISH_DIR="${ROOT}/tmp/gh-pages"

cd "$ROOT"
npm --prefix web run build:pages

rm -rf "$PUBLISH_DIR"
if git show-ref --verify --quiet refs/heads/gh-pages; then
  git worktree add "$PUBLISH_DIR" gh-pages
elif git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch origin gh-pages:gh-pages
  git worktree add "$PUBLISH_DIR" gh-pages
else
  git worktree add -B gh-pages "$PUBLISH_DIR" HEAD
fi

find "$PUBLISH_DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R web/dist/. "$PUBLISH_DIR"/
touch "$PUBLISH_DIR/.nojekyll"

cd "$PUBLISH_DIR"
git add -A
if git diff --cached --quiet; then
  echo "GitHub Pages demo is already up to date."
else
  git commit -m "Publish GitHub Pages demo"
  git push -u origin gh-pages
fi

cd "$ROOT"
git worktree remove "$PUBLISH_DIR"
