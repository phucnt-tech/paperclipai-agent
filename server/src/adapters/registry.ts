import type { ServerAdapterModule } from "./types.js";
import { readFile } from "node:fs/promises";
import {
  execute as claudeExecute,
  testEnvironment as claudeTestEnvironment,
  sessionCodec as claudeSessionCodec,
} from "@paperclipai/adapter-claude-local/server";
import { agentConfigurationDoc as claudeAgentConfigurationDoc, models as claudeModels } from "@paperclipai/adapter-claude-local";
import {
  execute as codexExecute,
  testEnvironment as codexTestEnvironment,
  sessionCodec as codexSessionCodec,
} from "@paperclipai/adapter-codex-local/server";
import { agentConfigurationDoc as codexAgentConfigurationDoc, models as codexModels } from "@paperclipai/adapter-codex-local";
import {
  execute as cursorExecute,
  testEnvironment as cursorTestEnvironment,
  sessionCodec as cursorSessionCodec,
} from "@paperclipai/adapter-cursor-local/server";
import { agentConfigurationDoc as cursorAgentConfigurationDoc, models as cursorModels } from "@paperclipai/adapter-cursor-local";
import {
  execute as openCodeExecute,
  testEnvironment as openCodeTestEnvironment,
  sessionCodec as openCodeSessionCodec,
  listOpenCodeModels,
} from "@paperclipai/adapter-opencode-local/server";
import {
  agentConfigurationDoc as openCodeAgentConfigurationDoc,
} from "@paperclipai/adapter-opencode-local";
import {
  execute as openclawExecute,
  testEnvironment as openclawTestEnvironment,
  onHireApproved as openclawOnHireApproved,
} from "@paperclipai/adapter-openclaw/server";
import {
  agentConfigurationDoc as openclawAgentConfigurationDoc,
  models as openclawModels,
} from "@paperclipai/adapter-openclaw";
import {
  execute as openclawGatewayExecute,
  testEnvironment as openclawGatewayTestEnvironment,
} from "@paperclipai/adapter-openclaw-gateway/server";
import {
  agentConfigurationDoc as openclawGatewayAgentConfigurationDoc,
  models as openclawGatewayModels,
} from "@paperclipai/adapter-openclaw-gateway";
import { listCodexModels } from "./codex-models.js";
import { listCursorModels } from "./cursor-models.js";
import {
  execute as piExecute,
  testEnvironment as piTestEnvironment,
  sessionCodec as piSessionCodec,
  listPiModels,
} from "@paperclipai/adapter-pi-local/server";
import {
  agentConfigurationDoc as piAgentConfigurationDoc,
} from "@paperclipai/adapter-pi-local";
import { processAdapter } from "./process/index.js";
import { httpAdapter } from "./http/index.js";
import { n8nAdapter } from "./n8n/index.js";

const claudeLocalAdapter: ServerAdapterModule = {
  type: "claude_local",
  execute: claudeExecute,
  testEnvironment: claudeTestEnvironment,
  sessionCodec: claudeSessionCodec,
  models: claudeModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: claudeAgentConfigurationDoc,
};

const codexLocalAdapter: ServerAdapterModule = {
  type: "codex_local",
  execute: codexExecute,
  testEnvironment: codexTestEnvironment,
  sessionCodec: codexSessionCodec,
  models: codexModels,
  listModels: listCodexModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: codexAgentConfigurationDoc,
};

const cursorLocalAdapter: ServerAdapterModule = {
  type: "cursor",
  execute: cursorExecute,
  testEnvironment: cursorTestEnvironment,
  sessionCodec: cursorSessionCodec,
  models: cursorModels,
  listModels: listCursorModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: cursorAgentConfigurationDoc,
};

const openclawAdapter: ServerAdapterModule = {
  type: "openclaw",
  execute: openclawExecute,
  testEnvironment: openclawTestEnvironment,
  onHireApproved: openclawOnHireApproved,
  models: openclawModels,
  // Enable short-lived local agent JWT injection as PAPERCLIP_API_KEY.
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: openclawAgentConfigurationDoc,
};

const openclawGatewayAdapter: ServerAdapterModule = {
  type: "openclaw_gateway",
  execute: openclawGatewayExecute,
  testEnvironment: openclawGatewayTestEnvironment,
  models: openclawGatewayModels,
  // Enable short-lived local agent JWT injection as PAPERCLIP_API_KEY for run callbacks.
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: openclawGatewayAgentConfigurationDoc,
};

const openclawEdgeAdapter: ServerAdapterModule = {
  type: "openclaw_edge",
  execute: openclawGatewayExecute,
  testEnvironment: openclawGatewayTestEnvironment,
  models: openclawGatewayModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc:
    "OpenClaw Edge (remote): connects to a remote edge gateway via websocket URL/token in adapter config.",
};

const openclawNativeAdapter: ServerAdapterModule = {
  type: "openclaw_native",
  execute: async (ctx) => {
    const baseConfig = (ctx.config ?? {}) as Record<string, unknown>;
    const mergedConfig: Record<string, unknown> = {
      ...baseConfig,
      mode: "embedded",
      disableDeviceAuth:
        typeof baseConfig.disableDeviceAuth === "boolean"
          ? baseConfig.disableDeviceAuth
          : false,
      autoPairOnFirstConnect:
        typeof baseConfig.autoPairOnFirstConnect === "boolean"
          ? baseConfig.autoPairOnFirstConnect
          : true,
      // Native CEO runs can be long; default to 6h if not explicitly configured.
      timeoutSec:
        typeof baseConfig.timeoutSec === "number" && Number.isFinite(baseConfig.timeoutSec)
          ? baseConfig.timeoutSec
          : 21600,
      waitTimeoutMs:
        typeof baseConfig.waitTimeoutMs === "number" && Number.isFinite(baseConfig.waitTimeoutMs)
          ? baseConfig.waitTimeoutMs
          : 21600000,
    };

    const envDevicePem =
      typeof process.env.PAPERCLIP_OPENCLAW_NATIVE_DEVICE_PRIVATE_KEY_PEM === "string"
        ? process.env.PAPERCLIP_OPENCLAW_NATIVE_DEVICE_PRIVATE_KEY_PEM.trim()
        : "";
    const envDevicePemPath =
      typeof process.env.PAPERCLIP_OPENCLAW_NATIVE_DEVICE_PRIVATE_KEY_PATH === "string"
        ? process.env.PAPERCLIP_OPENCLAW_NATIVE_DEVICE_PRIVATE_KEY_PATH.trim()
        : "";

    if (typeof mergedConfig.devicePrivateKeyPem !== "string" || !mergedConfig.devicePrivateKeyPem.trim()) {
      if (envDevicePem) {
        mergedConfig.devicePrivateKeyPem = envDevicePem;
      } else if (envDevicePemPath) {
        try {
          const filePem = await readFile(envDevicePemPath, "utf8");
          if (filePem.trim()) mergedConfig.devicePrivateKeyPem = filePem;
        } catch {
          // best effort only
        }
      }
    }

    return openclawGatewayExecute({
      ...ctx,
      config: mergedConfig,
    });
  },
  testEnvironment: async (ctx) =>
    openclawGatewayTestEnvironment({
      ...ctx,
      config: {
        ...(ctx.config ?? {}),
        mode: "embedded",
        url:
          (typeof process.env.PAPERCLIP_OPENCLAW_INTERNAL_WS_URL === "string" &&
            process.env.PAPERCLIP_OPENCLAW_INTERNAL_WS_URL.trim()) ||
          "ws://paperclip-openclaw-ceo:18789",
      },
    }),
  models: openclawGatewayModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc:
    "OpenClaw Native (embedded): uses in-cluster gateway defaults via PAPERCLIP_OPENCLAW_INTERNAL_WS_URL and PAPERCLIP_OPENCLAW_INTERNAL_TOKEN.",
};

const openCodeLocalAdapter: ServerAdapterModule = {
  type: "opencode_local",
  execute: openCodeExecute,
  testEnvironment: openCodeTestEnvironment,
  sessionCodec: openCodeSessionCodec,
  models: [],
  listModels: listOpenCodeModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: openCodeAgentConfigurationDoc,
};

const piLocalAdapter: ServerAdapterModule = {
  type: "pi_local",
  execute: piExecute,
  testEnvironment: piTestEnvironment,
  sessionCodec: piSessionCodec,
  models: [],
  listModels: listPiModels,
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: piAgentConfigurationDoc,
};

const adaptersByType = new Map<string, ServerAdapterModule>(
  [
    claudeLocalAdapter,
    codexLocalAdapter,
    openCodeLocalAdapter,
    piLocalAdapter,
    cursorLocalAdapter,
    openclawAdapter,
    openclawGatewayAdapter,
    openclawEdgeAdapter,
    openclawNativeAdapter,
    processAdapter,
    httpAdapter,
    n8nAdapter,
  ].map((a) => [a.type, a]),
);

export function getServerAdapter(type: string): ServerAdapterModule {
  const adapter = adaptersByType.get(type);
  if (!adapter) {
    // Fall back to process adapter for unknown types
    return processAdapter;
  }
  return adapter;
}

export async function listAdapterModels(type: string): Promise<{ id: string; label: string }[]> {
  const adapter = adaptersByType.get(type);
  if (!adapter) return [];
  if (adapter.listModels) {
    const discovered = await adapter.listModels();
    if (discovered.length > 0) return discovered;
  }
  return adapter.models ?? [];
}

export function listServerAdapters(): ServerAdapterModule[] {
  return Array.from(adaptersByType.values());
}

export function findServerAdapter(type: string): ServerAdapterModule | null {
  return adaptersByType.get(type) ?? null;
}
