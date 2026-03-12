import type { TranscriptEntry } from "../types";

export function parseN8nStdoutLine(line: string, ts: string): TranscriptEntry[] {
  return [{ kind: "stdout", ts, text: line }];
}
