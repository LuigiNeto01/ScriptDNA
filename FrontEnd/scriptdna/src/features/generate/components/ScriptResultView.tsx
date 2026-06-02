"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Copy, Download, Zap } from "lucide-react";
import { TermTooltip } from "@/components/help/term-tooltip";
import { ScriptLineCard } from "./ScriptLineCard";
import { QualityEvaluationCard } from "./QualityEvaluationCard";
import { EvidenceUsedPanel } from "./EvidenceUsedPanel";
import { copyScriptLines } from "../utils/generate-copy";
import { exportScriptAsText } from "../utils/script-export";
import type { GeneratedScript } from "@/types/api";

interface ScriptResultViewProps {
  script: GeneratedScript;
}

export function ScriptResultView({ script }: ScriptResultViewProps) {
  const [copied, setCopied] = useState(false);

  const hookPct = Math.round(script.analysis.hook_strength * 100);
  const hookColor =
    hookPct >= 70
      ? "text-green-500"
      : hookPct >= 40
        ? "text-yellow-500"
        : "text-red-500";
  const hookBarColor =
    hookPct >= 70 ? "bg-green-500" : hookPct >= 40 ? "bg-yellow-500" : "bg-red-500";

  const handleCopy = async () => {
    await copyScriptLines(script.lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => exportScriptAsText(script.lines);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <TermTooltip term="Força do gancho inicial" variant="underline">
            Quão bem a abertura do vídeo prende a atenção nos primeiros segundos.
          </TermTooltip>
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${hookColor}`} />
            <span className={`text-sm font-semibold ${hookColor}`}>{hookPct}%</span>
            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${hookPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${hookBarColor} rounded-full`}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            .txt
          </Button>
        </div>
      </div>

      {/* Quality evaluation */}
      {script.quality_evaluation && (
        <QualityEvaluationCard quality={script.quality_evaluation} />
      )}

      {/* Script lines */}
      <ScrollArea className="h-[480px]">
        <div className="space-y-3 pr-3">
          {script.lines.map((line, i) => (
            <ScriptLineCard key={i} line={line} index={i} />
          ))}
        </div>
      </ScrollArea>

      {/* Evidence panels */}
      <EvidenceUsedPanel script={script} />
    </motion.div>
  );
}
