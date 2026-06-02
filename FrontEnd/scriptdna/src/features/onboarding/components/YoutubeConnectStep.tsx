"use client";

import { useState } from "react";
import { useConnectYouTube } from "@/hooks/use-youtube";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Lock, Zap, BarChart3, MessageSquare, Loader2, ExternalLink, Tv2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface YoutubeConnectStepProps {
  alreadyConnected?: boolean;
  onSkip?: () => void;
  className?: string;
}

/**
 * YoutubeConnectStep — etapa de conexão do YouTube no wizard de onboarding.
 * Explica os benefícios em linguagem simples e oferece conectar ou pular.
 */
export function YoutubeConnectStep({
  alreadyConnected = false,
  onSkip,
  className,
}: YoutubeConnectStepProps) {
  const connectYoutube = useConnectYouTube();
  const [connecting, setConnecting] = useState(false);

  const benefits = [
    {
      icon: BarChart3,
      text: "Análise de retenção por parte do vídeo",
    },
    {
      icon: MessageSquare,
      text: "Análise de comentários e sentimento do público",
    },
    {
      icon: Zap,
      text: "Sugestões baseadas nos seus dados reais",
    },
    {
      icon: Lock,
      text: "Acesso somente leitura — não postamos nada",
    },
  ];

  async function handleConnect() {
    setConnecting(true);
    try {
      const result = await connectYoutube.mutateAsync();
      const data = result?.data as { authorization_url?: string } | undefined;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setConnecting(false);
    }
  }

  if (alreadyConnected) {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Tv2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <p className="font-semibold">Canal conectado!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Seu canal do YouTube já está vinculado ao ScriptDNA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Explicação */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        Conectar o YouTube permite que a IA analise seus Shorts, entenda o que retém atenção no seu
        canal e gere roteiros muito mais precisos com base em dados reais — não suposições.
      </p>

      {/* Benefícios */}
      <div className="grid gap-2.5">
        {benefits.map((b) => (
          <div key={b.text} className="flex items-center gap-3 text-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <b.icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-muted-foreground">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="flex-1 gap-2"
          data-testid="connect-youtube-btn"
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Conectar YouTube agora
        </Button>
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1"
          data-testid="skip-youtube-btn"
        >
          Fazer isso depois
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Você pode conectar a qualquer momento em{" "}
        <LinkButton href="/youtube" className="text-xs h-auto p-0">
          Meus Shorts
        </LinkButton>
      </p>
    </div>
  );
}
