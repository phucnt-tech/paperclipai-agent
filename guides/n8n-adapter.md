# n8n Adapter (Paperclip)

Adapter type: `n8n`

## What it does

The `n8n` adapter triggers an n8n workflow via a webhook. This is a **one-shot** execution adapter (MVP):
- Paperclip sends a JSON payload to an n8n webhook
- If webhook returns HTTP 2xx, the run succeeds (unless response includes `errorMessage`)

## Configure an agent

In Paperclip UI:
- Adapter Type: `n8n`
- n8n Webhook URL: `https://<your-n8n>/webhook/<path>`
- Auth token (optional): bearer token added as `Authorization: Bearer <token>` if you don't set a custom header

## Payload sent to n8n

```json
{
  "runId": "...",
  "agentId": "...",
  "agentName": "...",
  "companyId": "...",
  "context": { "...": "..." },
  "timestamp": "2026-..."
}
```

You can add custom static fields via `adapterConfig.payloadTemplate`.

## Expected response (optional)

If your n8n webhook returns JSON, Paperclip will capture it as `resultJson`. You may return:

```json
{
  "summary": "short human summary",
  "errorMessage": "optional error (sets exitCode=1)",
  "timedOut": false
}
```

## Notes

- This MVP does not yet support streaming logs/progress callbacks.
- Next step: add callback event channel (`run.progress`, `run.completed`) + HMAC signing.
