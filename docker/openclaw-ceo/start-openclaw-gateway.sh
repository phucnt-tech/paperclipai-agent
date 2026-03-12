#!/usr/bin/env bash
set -euo pipefail

PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "[paperclip-openclaw-ceo] OPENCLAW_GATEWAY_TOKEN is required"
  exit 1
fi

# Run gateway in foreground for container runtime.
exec openclaw gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$TOKEN" \
  --bind lan \
  --port "$PORT" \
  --compact
