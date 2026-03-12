import type { UIAdapterModule } from "../types";
import { parseN8nStdoutLine } from "./parse-stdout";
import { N8nConfigFields } from "./config-fields";
import { buildN8nConfig } from "./build-config";

export const n8nUIAdapter: UIAdapterModule = {
  type: "n8n",
  label: "n8n Workflow",
  parseStdoutLine: parseN8nStdoutLine,
  ConfigFields: N8nConfigFields,
  buildAdapterConfig: buildN8nConfig,
};
