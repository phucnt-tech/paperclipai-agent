import type { CreateConfigValues } from "../../components/AgentConfigForm";

export function buildN8nConfig(v: CreateConfigValues): Record<string, unknown> {
  const config: Record<string, unknown> = {
    method: "POST",
    timeoutSec: 30,
  };
  if (v.url) config.webhookUrl = v.url;
  return config;
}
