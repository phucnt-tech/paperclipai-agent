export function printN8nStdoutEvent(raw: string, _debug: boolean): void {
  const line = raw.trim();
  if (line) console.log(line);
}
