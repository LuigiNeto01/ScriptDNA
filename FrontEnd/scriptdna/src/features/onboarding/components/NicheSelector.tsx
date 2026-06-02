import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOnboardingStore, NICHE_SUGGESTIONS } from "@/stores/onboarding-store";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface NicheSelectorProps {
  className?: string;
}

/**
 * NicheSelector — campo livre de texto com chips de sugestão rápida.
 * Ao clicar num chip, preenche o campo e persiste no store.
 */
export function NicheSelector({ className }: NicheSelectorProps) {
  const { niche, setNiche } = useOnboardingStore();
  const [localValue, setLocalValue] = useState(niche ?? "");

  function handleChange(value: string) {
    setLocalValue(value);
    setNiche(value);
  }

  function handleChip(suggestion: string) {
    setLocalValue(suggestion);
    setNiche(suggestion);
  }

  function handleClear() {
    setLocalValue("");
    setNiche("");
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Campo livre */}
      <div className="relative">
        <Input
          id="niche-input"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ex: Minecraft, IA, Finanças, Humor..."
          className="pr-8"
          maxLength={60}
          data-testid="niche-input"
          aria-label="Nicho do canal"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpar nicho"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Contador */}
      {localValue.length > 40 && (
        <p className="text-xs text-muted-foreground text-right">
          {localValue.length}/60
        </p>
      )}

      {/* Chips de sugestão */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Sugestões populares
        </p>
        <div className="flex flex-wrap gap-2">
          {NICHE_SUGGESTIONS.map((suggestion) => {
            const selected = localValue === suggestion;
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleChip(suggestion)}
                data-testid={`niche-chip-${suggestion}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={selected}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
