#!/usr/bin/env bash
set -euo pipefail

# Start gateway daemon (idempotent)
openclaw gateway start || true

# Keep container alive and print status periodically if enabled
if [[ "${OPENCLAW_GATEWAY_STATUS_LOOP:-true}" == "true" ]]; then
  while true; do
    openclaw gateway status || true
    sleep "${OPENCLAW_GATEWAY_STATUS_INTERVAL_SEC:-30}"
  done
else
  tail -f /dev/null
fi
