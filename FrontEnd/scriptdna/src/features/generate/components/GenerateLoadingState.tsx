"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const LOADING_STEPS = [
  "Analisando suas referências...",
  "Buscando padrões que funcionaram...",
  "Criando variações de roteiro...",
  "Avaliando a melhor versão...",
];

export function GenerateLoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-6 rounded-xl border py-16 text-center"
      data-testid="generate-loading-state"
    >
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-muted" />
        <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">{LOADING_STEPS[step]}</p>
        <div className="flex justify-center gap-1.5">
          {LOADING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                i === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
