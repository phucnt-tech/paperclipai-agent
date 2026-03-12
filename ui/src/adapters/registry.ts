import type { UIAdapterModule } from "./types";
import { claudeLocalUIAdapter } from "./claude-local";
import { codexLocalUIAdapter } from "./codex-local";
import { cursorLocalUIAdapter } from "./cursor";
import { openCodeLocalUIAdapter } from "./opencode-local";
import { piLocalUIAdapter } from "./pi-local";
import { openClawUIAdapter } from "./openclaw";
import { openClawGatewayUIAdapter } from "./openclaw-gateway";
import { openClawNativeUIAdapter } from "./openclaw-native";
import { processUIAdapter } from "./process";
import { httpUIAdapter } from "./http";
import { n8nUIAdapter } from "./n8n";

const adaptersByType = new Map<string, UIAdapterModule>(
  [
    claudeLocalUIAdapter,
    codexLocalUIAdapter,
    openCodeLocalUIAdapter,
    piLocalUIAdapter,
    cursorLocalUIAdapter,
    openClawUIAdapter,
    openClawGatewayUIAdapter,
    openClawNativeUIAdapter,
    processUIAdapter,
    httpUIAdapter,
    n8nUIAdapter,
  ].map((a) => [a.type, a]),
);

export function getUIAdapter(type: string): UIAdapterModule {
  return adaptersByType.get(type) ?? processUIAdapter;
}
