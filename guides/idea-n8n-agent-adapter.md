# Idea Backlog: n8n as Agent Adapter for Paperclip

Status: draft (saved for later development)

## Why this idea

Treat n8n as a **specialized execution agent** while Paperclip remains the control plane:
- Paperclip owns issue/run state, approvals, audit trail, policy
- n8n executes multi-step workflows and external integrations

This preserves project spirit: governance in Paperclip, orchestration muscle in n8n.

---

## Positioning

### Recommended architecture
- `paperclip` = source of truth + governance + UX
- `n8n` = worker runtime (workflow engine)

### Non-goals
- n8n should not become source of truth for issue lifecycle
- n8n should not bypass Paperclip approval/policy gates

---

## Adapter concept: `adapterType = "n8n"`

## Config fields (proposed)
- `webhookUrl` (required)
- `authType`: `none | bearer | hmac`
- `authToken` (secret ref)
- `callbackSigningSecret` (secret ref)
- `timeoutSec`
- `waitTimeoutMs`
- `retryPolicy`: `{ maxRetries, backoffMs }`
- `workflowMode`: `sync | async`
- `sessionKeyStrategy`: `issue | task | fixed`

---

## Runtime contract (proposed)

### 1) Paperclip -> n8n (task dispatch)
Payload includes:
- `runId`, `taskId`, `companyId`, `agentId`
- `instructions`
- `context` (project/workspace/issue metadata)
- `capabilities` (allowed operations)
- `callback` (`url`, `token`, signing metadata)

### 2) n8n -> Paperclip (callback events)
Event types:
- `run.started`
- `run.progress`
- `run.log_chunk`
- `run.artifact`
- `run.requires_approval`
- `run.completed`
- `run.failed`

Mandatory fields for each event:
- `eventId` (idempotency)
- `runId`
- `timestamp`
- `type`
- `payload`

---

## Security requirements
- Verify callback signature (HMAC)
- Reject replay via nonce + timestamp window
- Enforce run-scope token (single run authorization)
- Redact sensitive fields before persisting logs
- Never allow n8n to mutate unrelated runs/issues

---

## Approval model
When n8n needs human decision:
1) send `run.requires_approval`
2) Paperclip creates approval record + UI action
3) decision callback back to n8n with scoped token
4) n8n resumes workflow

---

## Reliability
- Idempotent callbacks via `eventId`
- At-least-once delivery tolerated
- Dedupe in Paperclip run event store
- Timeout + backoff policy on both sides

---

## Rollout plan

### Phase 1 (MVP)
- Dispatch webhook + receive terminal result (`completed/failed`)
- Minimal progress logs

### Phase 2
- Streaming logs/artifacts
- Approval handshake support

### Phase 3
- Multi-workflow fanout per issue
- Rich observability dashboards

---

## UX notes
- In Agent create/edit UI, add `n8n` adapter option
- Show health test button (`Test n8n endpoint`)
- Show last callback status + signature check state

---

## Open questions
- Should callbacks be pull (poll n8n execution API) or push (webhook) by default?
- Should n8n workflows map 1:1 with agent ids or be selected per run?
- Do we need per-company callback endpoint isolation?

---

## Suggested first implementation files
- `packages/adapters/n8n/*`
- `server/src/adapters/registry.ts` (register)
- `ui/src/adapters/registry.ts` (form + labels)
- `cli/src/adapters/registry.ts` (stream formatting)
- `server/src/routes/a2a-callback.ts` (or adapter-scoped callback route)

