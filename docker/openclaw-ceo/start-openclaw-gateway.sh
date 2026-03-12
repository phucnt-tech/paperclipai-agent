#!/usr/bin/env bash
set -euo pipefail

PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"
DEVICE_KEY_PATH="${PAPERCLIP_OPENCLAW_NATIVE_DEVICE_PRIVATE_KEY_PATH:-/paperclip/openclaw-native-device.pem}"
AUTO_APPROVE="${OPENCLAW_AUTO_APPROVE_DEVICE_PAIRING:-true}"

if [[ -z "$TOKEN" ]]; then
  echo "[paperclip-openclaw-ceo] OPENCLAW_GATEWAY_TOKEN is required"
  exit 1
fi

# Ensure persistent native device private key exists for embedded/openclaw_native clients.
if [[ ! -s "$DEVICE_KEY_PATH" ]]; then
  mkdir -p "$(dirname "$DEVICE_KEY_PATH")"
  openssl genpkey -algorithm ed25519 -out "$DEVICE_KEY_PATH"
  chmod 600 "$DEVICE_KEY_PATH"
  echo "[paperclip-openclaw-ceo] generated native device private key at $DEVICE_KEY_PATH"
fi

# Disable Control UI by default for in-cluster service usage (avoids non-loopback allowedOrigins requirement).
openclaw config set gateway.controlUi.enabled false --strict-json || true

# Run gateway foreground in background process so we can auto-approve device pairing requests.
openclaw gateway run \
  --allow-unconfigured \
  --auth token \
  --token "$TOKEN" \
  --bind lan \
  --port "$PORT" \
  --compact &
GW_PID=$!

cleanup() {
  if kill -0 "$GW_PID" >/dev/null 2>&1; then
    kill "$GW_PID" >/dev/null 2>&1 || true
    wait "$GW_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

if [[ "$AUTO_APPROVE" == "true" ]]; then
  echo "[paperclip-openclaw-ceo] auto-approve pending device pairing enabled"
  while kill -0 "$GW_PID" >/dev/null 2>&1; do
    openclaw devices approve --latest --url "ws://127.0.0.1:${PORT}" --token "$TOKEN" >/dev/null 2>&1 || true
    sleep 3
  done
else
  wait "$GW_PID"
fi

wait "$GW_PID"
