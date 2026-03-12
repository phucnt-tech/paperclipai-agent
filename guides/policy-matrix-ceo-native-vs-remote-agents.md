# Policy Matrix — CEO Native vs Remote Gateway Agents

Status: draft v0.1

## Architecture scope
- CEO agent: native OpenClaw runtime in Paperclip ecosystem (in-cluster)
- Sub-agents: remote OpenClaw Gateway workers (independent runtime)

## Trust model
- CEO native: trusted orchestration actor inside Paperclip boundary
- Remote agents: semi-trusted executors with scoped task contracts

## Permission matrix (proposed)

| Capability | CEO Native | Remote Agent |
|---|---:|---:|
| Create project/goal/issue | ✅ | ⚠️ (only sub-issues under assigned parent) |
| Assign/Reassign issues | ✅ | ❌ |
| Close parent issue | ✅ | ❌ |
| Comment on parent issue | ✅ | ✅ (report status only) |
| Read company-wide board | ✅ | ⚠️ (project/issue scoped) |
| Trigger approvals | ✅ | ⚠️ (request only) |
| Approve/reject governance | ✅ (if role permits) | ❌ |
| Execute external tools | ⚠️ (allowed, but bounded) | ✅ (bounded by adapter/policy) |
| Modify policy/config | ⚠️ (admin-only) | ❌ |

Legend: ✅ allowed / ⚠️ constrained / ❌ denied

## Minimal guardrails (agreed)
Even with broader permissions in containerized runtime, keep these 3 controls:
1) Do not mount Docker socket
2) Restrict mounted volumes to required workspaces
3) Block sensitive egress paths where possible (metadata/internal-only surfaces)

## Lifecycle constraints
1. CEO creates/assigns sub-work
2. Remote agents execute and report back
3. Parent issue state is decided by CEO/native orchestration, not remote executors

## Required audit fields
All mutating actions should include:
- actorType (`ceo_native` | `remote_agent`)
- actorId
- sourceAdapterType
- parentIssueId (if sub-issue)
- correlationRunId

## Open choices
- Should remote agents be allowed to create sibling sub-issues?
- Should CEO auto-close parent when all children done?
- What should be default escalation timeout for blocked children?
