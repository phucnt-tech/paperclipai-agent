# Spec Draft — CEO Native OpenClaw in Paperclip Ecosystem

Status: draft v0.1

## Goal
Embed a native OpenClaw CEO runtime inside Paperclip (same stack/network), while keeping remote gateway agents as independent executors.

## Deployment model

Services:
- `paperclip-server` (control plane)
- `paperclip-db`
- `paperclip-openclaw-ceo` (native CEO runtime)

Remote workers:
- existing `openclaw_gateway` agents remain external and independent

## Runtime modes

### Mode A: native_ceo
- adapter/runtime hosted in-cluster
- high-context orchestration responsibilities
- can read board-wide context

### Mode B: remote_worker
- adapter via gateway/webhook
- task-scoped execution only
- no global governance rights

## Event flow
1) CEO receives objective/issue
2) CEO plans and emits delegation intents
3) Server creates sub-issues and assigns remote workers
4) Workers execute and report child status
5) Server wakes CEO on child updates
6) CEO aggregates and decides parent transition

## API/contract additions (proposed)

### New context fields
- `actorType`: `ceo_native` | `remote_agent`
- `orchestrationMode`: `native_ceo` | `remote_worker`
- `parentIssueId` (if any)

### New trigger detail
- `triggerDetail = ceo_orchestration`

### New reason
- `reason = issue_child_updated`

## Data model notes
No mandatory schema migration for MVP if using existing `contextSnapshot` JSON.
Optional v2 table:
- `orchestration_decisions` for explainability and replay.

## Rollout plan

Phase 1 (MVP)
- docs + policy matrix
- classify actors by adapter type and role
- enforce capability guard checks at service layer

Phase 2
- dedicated CEO runtime service container
- internal service-to-service auth token
- health and latency telemetry

Phase 3
- policy UI editor
- simulation mode for orchestration decisions
- SLO dashboards

## Non-goals (MVP)
- full zero-trust policy engine
- cross-company orchestration
- autonomous approval bypass

## Acceptance criteria
- CEO can orchestrate sub-issues end-to-end in-cluster
- Remote agents cannot mutate governance-critical fields
- Parent issues get deterministic child completion feedback
- No regressions in existing `openclaw_gateway` flow
