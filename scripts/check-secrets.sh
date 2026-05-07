#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

blocked_names='(^|/)(\.env(\..*)?|.*\.pem|.*\.key|.*\.p12|id_rsa|id_ed25519)$'
candidate_files="$(git ls-files --cached --others --exclude-standard)"
secret_files="$(printf '%s\n' "$candidate_files" | grep -E "$blocked_names" | grep -vE '(^|/)\.env\.example$' || true)"

if [[ -n "$secret_files" ]]; then
  echo "Refusing to continue: a secret-looking file is staged or untracked." >&2
  printf '%s\n' "$secret_files" >&2
  exit 1
fi

if git diff --cached --unified=0 | grep -Ei '(ghp_|gho_|github_pat_|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|PRIVATE) KEY|api[_-]?key[[:space:]]*=|secret[[:space:]]*=|password[[:space:]]*=)' >/dev/null; then
  echo "Refusing to continue: staged diff contains a secret-looking token." >&2
  exit 1
fi

echo "secret check passed"
