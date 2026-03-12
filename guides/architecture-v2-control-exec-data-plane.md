# Architecture v2 (Draft) — Control Plane / Execution Plane / Data Plane

Status: draft for review before implementation

## 1) Planes

### Control Plane (Paperclip)
- Owns goals/projects/issues/runs/approvals
- Scheduling/orchestration logic
- Delegation and parent-child lifecycle
- Governance and policy enforcement

### Execution Plane
- Native CEO runtime (OpenClaw in-cluster)
- Remote workers (openclaw_gateway / future n8n)
- Tool execution + task completion

### Data Plane
- Postgres (source of truth)
- Event log stream (run lifecycle + delegation + approvals)
- Memory sync channels (optional)

## 2) Proposed component boundaries

- `paperclip-server`: control plane APIs + orchestration
- `paperclip-openclaw-ceo`: native CEO executor (in ecosystem)
- `remote-openclaw-workers`: independent worker agents via gateway
- `notification-service`: Telegram event sink

## 3) Shared memory/storage model (append-first)

### Goals
- Keep enough cross-agent context without leaking unnecessary data
- Make history auditable/replayable
- Keep sync simple via Git
- Enforce **single-writer** model for context repository

### Storage strategy
- Use a dedicated repo for Paperclip context (e.g. `paperclip-context`)
- Data tree is append-first:
  - daily logs append-only (`memory/YYYY-MM-DD.md`)
  - run events append-only (`events/YYYY/MM/DD/*.jsonl`)
  - decisions append-only (`decisions/*.md`)
- Avoid destructive rewrites in normal flow; corrections are appended as new entries.

### Sync mechanism
- CEO native agent performs periodic `commit + push` (e.g. every 15-30m or on run finalization batches)
- Remote agents are **pull-only** for context (scoped fetch before execution)
- Remote agents do **not** push context directly to repo; they report events/results to Paperclip
- Paperclip/CEO normalizes those events into append logs, then pushes via the single-writer flow
- Sync is scope-bound (company/project/issue), not full-repo dump by default

### Scope partitioning
- `context/company/<companyId>/...`
- `context/project/<projectId>/...`
- `context/issue/<issueId>/...`

Remote agent receives only required scope paths for assigned task.

### Conflict handling
- Prefer append files + JSONL to reduce merge conflicts
- If conflict occurs:
  1) remote agent rebases/pulls
  2) re-appends unresolved lines
  3) retries push
- CEO can run periodic compaction into curated summaries without deleting raw append logs.

## 4) Key runtime contracts

### A) Delegation contract
- Parent issue creates child issues with explicit assignees
- Child completion reports back to parent issue
- Parent assignee gets wakeup on child updates

### B) Event contract
Core events:
- `run.started`
- `run.completed`
- `run.failed`
- `issue.child.updated`
- `delegation.created`
- `approval.required`

Each event should include:
- `companyId`, `runId`, `issueId`
- `agentId`, `adapterType`
- `timestamp`, `status`, `summary/error`

## 5) Policy/guardrails (minimal)

Even with broad app-level permissions, keep infra-safe defaults:
1. No Docker socket mount
2. Scoped volume mounts only
3. Block sensitive egress where feasible

Governance rules:
- Native CEO can orchestrate and reassign
- Remote workers execute scoped tasks and report status
- Governance-critical transitions stay in control plane

## 6) Reliability rules

- Idempotency keys for delegated wakeups and callbacks
- Dedupe markers for parent comments (`[child-run:<runId>]`)
- Retry with backoff for notification delivery
- Deterministic workspace paths per project/agent

## 7) Rollout proposal

Phase 1 (done/near-done)
- Child -> parent reporting
- Parent wakeup on child completion
- Telegram run events

Phase 2
- Native CEO service container + internal token auth
- Event bus abstraction for all outbound notifications

Phase 3
- Unified callback protocol for remote adapters (gateway + n8n)
- UI policy editor and observability panels

## 8) Open questions before implementation

- Do we auto-close parent when all children done, or require CEO confirmation?
- Which events are mandatory for Telegram vs optional?
- Should n8n adapter remain one-shot for MVP or include callback channel immediately?
- Is escalation timeout global or per project?
- Do we need a dedicated compaction cadence for single-writer memory repo (daily vs hourly)?
