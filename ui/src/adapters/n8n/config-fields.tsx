import type { AdapterConfigFieldsProps } from "../types";
import { Field, DraftInput, help } from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function N8nConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  return (
    <>
      <Field label="n8n Webhook URL" hint={help.webhookUrl}>
        <DraftInput
          value={
            isCreate
              ? values!.url
              : eff("adapterConfig", "webhookUrl", String(config.webhookUrl ?? config.url ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ url: v })
              : mark("adapterConfig", "webhookUrl", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="https://n8n.example.com/webhook/..."
        />
      </Field>

      <Field label="Auth token (optional)">
        <DraftInput
          value={eff("adapterConfig", "authToken", String(config.authToken ?? ""))}
          onCommit={(v) => mark("adapterConfig", "authToken", v || undefined)}
          immediate
          className={inputClass}
          placeholder="token"
        />
      </Field>
    </>
  );
}
