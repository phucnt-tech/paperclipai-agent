import type { AdapterConfigFieldsProps } from "../types";

export function OpenClawNativeConfigFields(_props: AdapterConfigFieldsProps) {
  return (
    <div className="rounded-md border border-border p-3 text-xs text-muted-foreground leading-relaxed">
      <p>
        OpenClaw Native runs in embedded mode and uses internal ecosystem defaults.
      </p>
      <p className="mt-1">
        Endpoint and token are resolved from server env:
        <code className="ml-1">PAPERCLIP_OPENCLAW_INTERNAL_WS_URL</code>,
        <code className="ml-1">PAPERCLIP_OPENCLAW_INTERNAL_TOKEN</code>.
      </p>
    </div>
  );
}
