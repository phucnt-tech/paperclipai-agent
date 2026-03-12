import type { UIAdapterModule } from "../types";
import { parseOpenClawGatewayStdoutLine } from "@paperclipai/adapter-openclaw-gateway/ui";
import { buildOpenClawGatewayConfig } from "@paperclipai/adapter-openclaw-gateway/ui";
import { OpenClawGatewayConfigFields } from "../openclaw-gateway/config-fields";

export const openClawEdgeUIAdapter: UIAdapterModule = {
  type: "openclaw_edge",
  label: "OpenClaw Edge",
  parseStdoutLine: parseOpenClawGatewayStdoutLine,
  ConfigFields: OpenClawGatewayConfigFields,
  buildAdapterConfig: buildOpenClawGatewayConfig,
};
