# OpenClaw Edge v1 (Remote Worker via Gateway)

Adapter type: `openclaw_edge`

## Purpose
Use a remote OpenClaw worker (on another VPS/site) through OpenClaw gateway while keeping Paperclip as control plane.

## Contract (v1)
- Paperclip dispatches task/run context via `openclaw_edge` adapter
- Remote edge executes task and streams result back through gateway protocol
- Memory/context writeback remains centralized (single-writer in Paperclip/CEO)

## Minimum agent config
- `url`: `ws://<remote-edge-host>:18789` or `wss://...`
- token/header auth (same as `openclaw_gateway`)
- optional timeout overrides

## Recommended network
- Private mesh (WireGuard/Tailscale)
- Resolve endpoint through private IP/DNS

## Security notes
- Keep remote edge token scoped/rotated
- Avoid exposing gateway public internet when possible
- Prefer allowlist of source peers

## Known scope
- v1 does not include separate callback API; uses existing gateway event stream.
- v1 intentionally reuses OpenClaw gateway adapter internals for speed.
