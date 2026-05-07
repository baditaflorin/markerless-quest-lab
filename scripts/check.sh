#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

./scripts/check-secrets.sh

unformatted="$(gofmt -l cmd internal)"
if [[ -n "$unformatted" ]]; then
  echo "Go files need gofmt:" >&2
  echo "$unformatted" >&2
  exit 1
fi

go test ./...

if [[ ! -d web/node_modules ]]; then
  npm --prefix web ci
fi
npm --prefix web run test
npm --prefix web run build

docker compose config >/dev/null

echo "checks passed"
