"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { formatBeatName } from "@/lib/formatters";
import type { ScriptLine } from "@/types/api";

interface ScriptLineCardProps {
  line: ScriptLine;
  index: number;
}

export function ScriptLineCard({ line, index }: ScriptLineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-lg border p-4 space-y-2"
      data-testid="script-line"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          {line.start}s – {line.end}s
        </span>
        <Badge variant="outline" className="text-xs">
          {formatBeatName(line.function)}
        </Badge>
      </div>

      <p className="text-sm leading-relaxed">{line.line}</p>

      {line.retention_note && (
        <div className="border-l-2 border-primary/30 pl-3 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Por que segura atenção</p>
          <p className="text-xs text-muted-foreground italic">{line.retention_note}</p>
        </div>
      )}

      {line.viewer_question && (
        <div className="flex items-start gap-2 text-xs text-primary/80">
          <MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Pergunta criada: </span>
            {line.viewer_question}
          </span>
        </div>
      )}
    </motion.div>
  );
}
