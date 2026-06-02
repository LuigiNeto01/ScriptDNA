import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuração inicial — ScriptDNA",
  description: "Configure sua conta para começar a criar roteiros com inteligência artificial.",
};

/**
 * Layout fullscreen para o wizard de onboarding.
 * Não exibe sidebar — experiência focada de primeiro acesso.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
