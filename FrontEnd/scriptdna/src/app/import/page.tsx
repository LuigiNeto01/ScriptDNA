"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportHelpCard } from "@/features/import/components/ImportHelpCard";
import { ImportModeTabs } from "@/features/import/components/ImportModeTabs";
import { ImportPageHeader } from "@/features/import/components/ImportPageHeader";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ImportPageHeader />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar referencia</CardTitle>
            <CardDescription>
              Escolha o formato do exemplo que voce quer que a IA estude.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportModeTabs />
          </CardContent>
        </Card>

        <ImportHelpCard />
      </div>
    </div>
  );
}
