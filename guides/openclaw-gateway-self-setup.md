# OpenClaw Self-Setup From Source (Paperclip + OpenClaw Gateway)

Mục tiêu: để một OpenClaw agent có thể tự đọc file này và setup full flow từ bước clone source đến khi chạy được task qua `openclaw_gateway`.

---

## 0) Điều kiện trước khi chạy

- Host Linux có Docker + Docker Compose + Git
- Có quyền chạy `openclaw` CLI trên host
- Có gateway đang chạy (`openclaw gateway status`)
- Port mặc định:
  - Paperclip: `3100`
  - Postgres: `5433` (compose mapping)
  - OpenClaw gateway: `18789`

> Nếu Paperclip chạy trong container và OpenClaw chạy trên host, dùng endpoint gateway: `ws://host.docker.internal:18789`.

---

## 1) Clone source

```bash
cd /opt
rm -rf paperclipai-agent
git clone https://github.com/phucnt-tech/paperclipai-agent.git
cd paperclipai-agent
```

Xác nhận branch:

```bash
git branch --show-current
```

---

## 2) Chuẩn bị env

Tạo `.env` tối thiểu:

```bash
cat > .env <<'EOF'
BETTER_AUTH_SECRET=CHANGE_ME_STRONG_SECRET
PAPERCLIP_PORT=3100
PAPERCLIP_DB_PORT=5433
PAPERCLIP_PUBLIC_URL=http://127.0.0.1:3100
PAPERCLIP_ALLOWED_HOSTNAMES=localhost,127.0.0.1
BETTER_AUTH_TRUSTED_ORIGINS=http://127.0.0.1:3100
# Optional: host Codex folder mount
PAPERCLIP_CODEX_HOST_DIR=/root/.codex
PAPERCLIP_CODEX_CONTAINER_DIR=/paperclip/.codex
# Optional Codex skill injection controls
# PAPERCLIP_CODEX_INJECT_SKILLS=true
# PAPERCLIP_CODEX_LOG_SKILL_INJECTION=false

# Optional Telegram run event notifications
# PAPERCLIP_TELEGRAM_LOG_ENABLED=true
# PAPERCLIP_TELEGRAM_CHAT_ID=-1001234567890
# PAPERCLIP_TELEGRAM_BOT_TOKEN=123456:token
EOF
```

---

## 3) Build + run container

Repo đã có sẵn `docker-compose.yml` ở thư mục root (`paperclipai-agent/docker-compose.yml`) với 2 service:
- `db` (Postgres)
- `server` (Paperclip)

Chạy:

```bash
docker compose up -d --build
```

Health check:

```bash
docker compose ps
curl -fsS http://127.0.0.1:3100/api/health
```

Kỳ vọng: service `server` Up, `db` healthy.

---

## 4) Lấy gateway token + xác nhận gateway

```bash
openclaw gateway status
```

Dùng token gateway hiện tại (không tự gen bừa nếu hệ thống đang chạy ổn định).

---

## 5) Tạo/Chỉnh agent OpenClaw Gateway trong Paperclip

Trong Agent config:

- `adapterType`: `openclaw_gateway`
- `url`: `ws://host.docker.internal:18789` (nếu Paperclip trong Docker)
- Header: `x-openclaw-token: <GATEWAY_TOKEN>`
- `waitTimeoutMs`: `120000` (có thể tăng 300000 nếu task nặng)
- `sessionKeyStrategy`: `issue`

### Bắt buộc để tránh pair lặp

- set `devicePrivateKeyPem` (PEM Ed25519) để identity ổn định

Tạo key ví dụ:

```bash
openssl genpkey -algorithm ed25519 -out /tmp/openclaw-device.pem
cat /tmp/openclaw-device.pem
```

Paste toàn bộ PEM vào field `devicePrivateKeyPem` trong Agent config.

---

## 6) API issue flow auth (mặc định mới)

Mặc định hiện tại: `openclaw_gateway` tự inject short-lived run JWT làm `PAPERCLIP_API_KEY` cho callback API.
=> Không còn bắt buộc phải có file claim-key trong workflow chuẩn.

Tuỳ chọn nâng cao:
- có thể set explicit `PAPERCLIP_API_KEY` trong env vars nếu muốn override hành vi mặc định
- fallback file `~/.openclaw/workspace/paperclip-claimed-api-key.json` chỉ dùng cho flow cũ/tuỳ biến

Nếu tất cả nguồn key đều thiếu, agent sẽ fail ở bước `/api/agents/me` dù gateway đã connect.

---

## 7) Pairing lần đầu (nếu gặp)

Nếu log báo `pairing required`:

```bash
openclaw devices approve --latest --url ws://127.0.0.1:18789 --token <GATEWAY_TOKEN>
```

Sau khi đã có `devicePrivateKeyPem`, pairing sẽ được reuse ổn định.

---

## 8) Smoke test tối thiểu

1. Trigger 1 run manual
2. Kiểm tra run không fail `pairing_required`
3. Kiểm tra run không fail vì thiếu `PAPERCLIP_API_KEY`
4. Kiểm tra run hoàn tất/tạo update issue được

Gợi ý kiểm tra DB:

```bash
docker compose exec -T db psql -U paperclip -d paperclip -c \
"select id,status,error_code,created_at from heartbeat_runs order by created_at desc limit 10;"
```

---

### Ghi chú workspace theo project (mặc định mới)

Khi issue có `projectId` nhưng chưa có project workspace cấu hình sẵn, server sẽ tự dùng thư mục deterministic:
- `/paperclip/instances/default/workspaces/project-<projectId>`

Với wake reason `issue_assigned`, server sẽ tự tạo thư mục này (và tự ghi một project workspace primary) để các run sau ổn định, không còn fallback cảnh báo lặp.

Có thể đổi root bằng env:
- `PAPERCLIP_PROJECT_WORKSPACES_ROOT=/paperclip/instances/default/workspaces`

## 9) Re-deploy sau khi cập nhật code

```bash
git pull
docker compose up -d --build
docker compose ps
```

## 10) Troubleshooting nhanh

### A) `pairing required`
- approve pending device
- kiểm tra agent có `devicePrivateKeyPem` chưa
- xác nhận token đúng gateway

### B) `No such file ~/.openclaw/workspace/paperclip-claimed-api-key.json`
- với bản hiện tại, workflow chuẩn không cần file này
- kiểm tra server đang chạy commit có `openclaw_gateway` inject JWT (`supportsLocalAgentJwt=true`)
- nếu chạy flow custom cũ, set explicit `PAPERCLIP_API_KEY` trong adapter env vars

### C) `wait timeout`
- tăng `waitTimeoutMs` lên `300000`
- giảm scope task hoặc chia nhỏ issue

### D) Không thấy `OpenClaw Gateway` trong UI
- pull code mới nhất
- rebuild `docker compose up -d --build`
- hard refresh browser

---

## 11) One-shot checklist (copy/paste)

- [ ] Clone repo đúng branch
- [ ] `.env` đã set `BETTER_AUTH_SECRET`
- [ ] `docker compose up -d --build` thành công
- [ ] Gateway reachable + token đúng
- [ ] Agent dùng `openclaw_gateway`
- [ ] `devicePrivateKeyPem` đã lưu
- [ ] `PAPERCLIP_API_KEY` có mặt trong run context (auto-injected JWT hoặc env override)
- [ ] Pairing approve (nếu cần) thành công
- [ ] Smoke run pass

---

## 12) Security notes

- Không commit secrets/token/key PEM vào git.
- Chỉ lưu token trong env/config protected.
- Rotate token nếu nghi ngờ lộ.
