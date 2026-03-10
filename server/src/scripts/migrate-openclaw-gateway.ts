import { agents, createDb } from "@paperclipai/db";
import { agentService } from "../services/agents.js";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function normalizeHeaders(headers: unknown): JsonRecord {
  const rec = asRecord(headers);
  return rec ? { ...rec } : {};
}

function migrateAdapterConfig(config: unknown): { nextConfig: JsonRecord; notes: string[] } {
  const current = asRecord(config) ?? {};
  const next: JsonRecord = { ...current };
  const notes: string[] = [];

  const headers = normalizeHeaders(current.headers);

  const legacyAuth =
    (typeof headers["x-openclaw-auth"] === "string" && String(headers["x-openclaw-auth"])) ||
    (typeof current.authToken === "string" && String(current.authToken)) ||
    (typeof current.password === "string" && String(current.password));

  if (!headers["x-openclaw-token"] && legacyAuth) {
    headers["x-openclaw-token"] = legacyAuth;
    notes.push("set headers.x-openclaw-token from legacy auth field");
  }

  next.headers = headers;

  if (typeof next.url === "string") {
    const url = String(next.url).trim();
    if (url.startsWith("http://")) {
      notes.push("url uses http:// (consider ws:// for openclaw_gateway)");
    } else if (url.startsWith("https://")) {
      notes.push("url uses https:// (consider wss:// for openclaw_gateway)");
    }
  } else {
    notes.push("missing url in adapterConfig");
  }

  return { nextConfig: next, notes };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const apply = process.argv.includes("--apply");
  const companyIdArg = process.argv.find((a) => a.startsWith("--company="));
  const targetCompanyId = companyIdArg ? companyIdArg.split("=")[1] : null;

  const db = createDb(dbUrl);
  const agentsSvc = agentService(db);
  const allAgents = await db.select().from(agents);

  const candidates = allAgents.filter((agent) => {
    if (agent.adapterType !== "openclaw") return false;
    if (targetCompanyId && agent.companyId !== targetCompanyId) return false;
    return true;
  });

  let changed = 0;

  for (const agent of candidates) {
    const { nextConfig, notes } = migrateAdapterConfig(agent.adapterConfig);

    console.log(`- ${agent.id} (${agent.name})`);
    if (notes.length === 0) {
      console.log("  notes: none");
    } else {
      for (const note of notes) console.log(`  note: ${note}`);
    }

    changed += 1;

    if (!apply) continue;

    await agentsSvc.update(agent.id, {
      adapterType: "openclaw_gateway",
      adapterConfig: nextConfig,
    });
  }

  if (!apply) {
    console.log(`\nDry run complete: ${changed} openclaw agent(s) would migrate to openclaw_gateway.`);
    console.log("Run again with --apply to persist.");
    process.exit(0);
  }

  console.log(`\nMigration complete: ${changed} agent(s) migrated to openclaw_gateway.`);
  process.exit(0);
}

void main();
