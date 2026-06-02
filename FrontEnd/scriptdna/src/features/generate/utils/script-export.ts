import type { ScriptLine } from "@/types/api";
import { buildScriptText } from "./generate-copy";

export function exportScriptAsText(
  lines: ScriptLine[],
  filename = "roteiro-scriptdna.txt"
): void {
  const text = buildScriptText(lines);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
