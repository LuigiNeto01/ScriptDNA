import type { ScriptLine } from "@/types/api";

export function buildScriptText(lines: ScriptLine[]): string {
  return lines.map((l) => `[${l.start} - ${l.end}] ${l.line}`).join("\n");
}

export async function copyScriptLines(lines: ScriptLine[]): Promise<void> {
  await navigator.clipboard.writeText(buildScriptText(lines));
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
