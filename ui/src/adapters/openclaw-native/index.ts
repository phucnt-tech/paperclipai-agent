import type { UIAdapterModule } from "../types";
import { parseOpenClawGatewayStdoutLine } from "@paperclipai/adapter-openclaw-gateway/ui";
import { OpenClawNativeConfigFields } from "./config-fields";
import { buildOpenClawNativeConfig } from "./build-config";

export const openClawNativeUIAdapter: UIAdapterModule = {
  type: "openclaw_native",
  label: "OpenClaw Native",
  parseStdoutLine: parseOpenClawGatewayStdoutLine,
  ConfigFields: OpenClawNativeConfigFields,
  buildAdapterConfig: buildOpenClawNativeConfig,
};
