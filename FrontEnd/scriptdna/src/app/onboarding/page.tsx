import type { Metadata } from "next";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";

export const metadata: Metadata = {
  title: "Configuração inicial — ScriptDNA",
  description:
    "Siga os passos para configurar sua conta e começar a criar roteiros de Shorts com IA.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
