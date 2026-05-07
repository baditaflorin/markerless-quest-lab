#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-18080}"
LOG_FILE="${ROOT}/tmp/smoke-api.log"
mkdir -p "${ROOT}/tmp"

HTTP_ADDR=":${PORT}" PUBLIC_BASE_URL="http://localhost:25342" go run ./cmd/server >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

curl -fsS "http://127.0.0.1:${PORT}/readyz" | grep -q '"status":"ready"'
curl -fsS "http://127.0.0.1:${PORT}/api/challenges" | grep -q "mirror-squat"

session_json="$(curl -fsS -X POST "http://127.0.0.1:${PORT}/api/sessions")"
session_id="$(printf '%s' "$session_json" | sed -n 's/.*"sessionId":"\([^"]*\)".*/\1/p')"
if [[ -z "$session_id" ]]; then
  echo "session smoke failed: no sessionId in ${session_json}" >&2
  exit 1
fi

curl -fsS \
  -H "Content-Type: application/json" \
  -X POST "http://127.0.0.1:${PORT}/api/challenges/calibrate-frame/events" \
  -d "{\"sessionId\":\"${session_id}\",\"eventType\":\"completion\",\"score\":0.95,\"visibility\":0.92,\"durationSeconds\":10,\"clientTimestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" \
  | grep -q '"completed":true'

curl -fsS "http://127.0.0.1:${PORT}/metrics" | grep -q "markerless_challenge_events_total"
npm --prefix web run build >/dev/null
docker compose config >/dev/null

echo "smoke checks passed"
