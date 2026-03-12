import type { ServerAdapterModule } from "../types.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";

export const n8nAdapter: ServerAdapterModule = {
  type: "n8n",
  execute,
  testEnvironment,
  models: [],
  supportsLocalAgentJwt: true,
  agentConfigurationDoc: `# n8n agent configuration

Adapter: n8n

Core fields:
- webhookUrl (string, required): n8n webhook endpoint
- method (string, optional): default POST
- headers (object, optional): custom headers
- authToken (string, optional): bearer token if Authorization header not set
- timeoutSec/timeoutMs (number, optional)
- payloadTemplate (object, optional): merged with run metadata
`,
};
