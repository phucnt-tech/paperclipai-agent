import type { CreateConfigValues } from "../../components/AgentConfigForm";

export function buildOpenClawNativeConfig(_values: CreateConfigValues): Record<string, unknown> {
  return {
    mode: "embedded",
  };
}
