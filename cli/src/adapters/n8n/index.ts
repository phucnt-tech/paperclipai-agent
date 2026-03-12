import type { CLIAdapterModule } from "@paperclipai/adapter-utils";
import { printN8nStdoutEvent } from "./format-event.js";

export const n8nCLIAdapter: CLIAdapterModule = {
  type: "n8n",
  formatStdoutEvent: printN8nStdoutEvent,
};
