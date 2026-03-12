import type { AdapterExecutionContext, AdapterExecutionResult } from "../types.js";
import { asBoolean, asNumber, asString, parseObject } from "../utils.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { config, runId, agent, context } = ctx;

  const url = asString(config.webhookUrl ?? config.url, "");
  if (!url) throw new Error("n8n adapter missing webhookUrl");

  const method = asString(config.method, "POST").toUpperCase();
  const timeoutMsRaw = asNumber(config.timeoutMs, 0);
  const timeoutSecRaw = asNumber(config.timeoutSec, 0);
  const timeoutMs = timeoutMsRaw > 0 ? timeoutMsRaw : timeoutSecRaw > 0 ? timeoutSecRaw * 1000 : 30_000;

  const headers = parseObject(config.headers) as Record<string, string>;
  const authToken = asString(config.authToken, "");
  const includeRawContext = asBoolean(config.includeRawContext, true);
  const payloadTemplate = parseObject(config.payloadTemplate);

  const body = {
    ...payloadTemplate,
    runId,
    agentId: agent.id,
    agentName: agent.name,
    companyId: agent.companyId,
    context: includeRawContext ? context : undefined,
    timestamp: new Date().toISOString(),
  };

  const requestHeaders: Record<string, string> = {
    "content-type": "application/json",
    ...headers,
  };
  if (authToken && !requestHeaders.authorization) {
    requestHeaders.authorization = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`n8n invoke failed with status ${response.status}${text ? `: ${text.slice(0, 300)}` : ""}`);
    }

    let json: Record<string, unknown> | null = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    }

    const summary = asString(json?.summary, `n8n ${method} ${url}`);
    const timedOut = asBoolean(json?.timedOut, false);
    const errorMessage = asString(json?.errorMessage, "") || null;

    return {
      exitCode: errorMessage ? 1 : 0,
      signal: null,
      timedOut,
      errorMessage,
      summary,
      resultJson: json,
    };
  } finally {
    clearTimeout(timer);
  }
}
