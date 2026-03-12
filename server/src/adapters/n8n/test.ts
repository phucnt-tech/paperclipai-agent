import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "../types.js";
import { asString, parseObject } from "../utils.js";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const urlValue = asString(config.webhookUrl ?? config.url, "");

  if (!urlValue) {
    checks.push({
      code: "n8n_webhook_missing",
      level: "error",
      message: "n8n adapter requires webhookUrl.",
      hint: "Set adapterConfig.webhookUrl to an n8n webhook endpoint.",
    });
  }

  let url: URL | null = null;
  if (urlValue) {
    try {
      url = new URL(urlValue);
      if (!["http:", "https:"].includes(url.protocol)) {
        checks.push({
          code: "n8n_url_protocol_invalid",
          level: "error",
          message: `Unsupported URL protocol: ${url.protocol}`,
          hint: "Use http:// or https://",
        });
      }
    } catch {
      checks.push({
        code: "n8n_url_invalid",
        level: "error",
        message: `Invalid webhookUrl: ${urlValue}`,
      });
    }
  }

  if (url && ["http:", "https:"].includes(url.protocol)) {
    checks.push({
      code: "n8n_url_valid",
      level: "info",
      message: `Configured endpoint: ${url.toString()}`,
    });
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
