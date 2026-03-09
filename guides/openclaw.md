# Guide: Integrate Paperclip with OpenClaw

This guide describes a **Docker Paperclip** ↔ **host OpenClaw Gateway** integration using **SSE** via the OpenAI-compatible endpoint:

- Paperclip → `POST /v1/chat/completions` (SSE or non-stream)
- OpenClaw Gateway runs on the host (same machine as Docker)

> Why SSE and not webhook hooks?
> 
> OpenClaw’s `POST /hooks/*` endpoints are not guaranteed to be enabled/exposed on the Gateway. The OpenAI-compatible HTTP endpoint is the most portable integration surface.

---

## 0) Prereqs

- Paperclip running in Docker (this repo includes `docker-compose.yml`).
- OpenClaw Gateway running on the host.
- You have the **Gateway token** (`gateway.auth.token`) available locally.

**Security note:** the Gateway token is an operator credential. Keep it private.

---

## 1) Enable OpenClaw HTTP endpoint

OpenClaw’s OpenAI-compatible HTTP endpoint is disabled by default. Enable it:

```bash
openclaw config set gateway.http.endpoints.chatCompletions.enabled true
openclaw gateway restart
```

### Ensure a usable model is configured

If your agent default model resolves to a provider with no configured models (example: `manifest/auto` without a connected provider), calls will fail.

A quick working default:

```bash
openclaw config set agents.defaults.model.primary "openai-codex/gpt-5.2"
openclaw gateway restart
```

---

## 2) Verify the endpoint from the host

```bash
export OPENCLAW_TOKEN="<gateway.auth.token>"

curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H "Authorization: Bearer $OPENCLAW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openclaw",
    "messages": [{"role": "user", "content": "hi"}],
    "stream": false
  }'
```

If you get a valid JSON response, the integration surface is ready.

---

## 3) Make Docker reach the host gateway (Linux)

On Linux, `host.docker.internal` is not always present. This repo adds:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

so the Paperclip container can reach the host OpenClaw Gateway at:

- `http://host.docker.internal:18789`

Test from inside the container:

```bash
docker exec -it paperclip-server-1 sh -lc 'curl -sS http://host.docker.internal:18789/health'
```

Expected:

```json
{"ok":true,"status":"live"}
```

---

## 4) Configure the OpenClaw adapter in Paperclip

In Paperclip UI (Board → Agents/Adapters), configure:

- **Adapter**: `openclaw`
- **Transport**: `sse`
- **Method**: `POST`
- **URL**: `http://host.docker.internal:18789/v1/chat/completions`
- **Headers**:
  - Recommended:
    - `Authorization: Bearer <gateway.auth.token>`
  - Alternative (also supported):
    - `x-openclaw-token: <gateway.auth.token>`

### Common pitfalls

- **400 Missing user message in messages**
  - Means you’re sending the wrong payload shape. `POST /v1/chat/completions` must include `messages[]` with at least one `role:"user"` entry.

- **fetch failed**
  - Usually means the container can’t resolve/reach `host.docker.internal`. Ensure `extra_hosts` is set as above.

- **No model available**
  - Your OpenClaw agent default model is not usable. Set `agents.defaults.model.primary` to a working provider/model.

---

## 5) Recommended network posture

- Keep OpenClaw Gateway (`:18789`) private (loopback / LAN / tailnet). Do not expose it publicly.
- If you must access remotely, prefer a VPN/tailnet + firewall allowlist.

