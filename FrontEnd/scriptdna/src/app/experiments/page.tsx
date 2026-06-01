"use client";

import { useState } from "react";
import { useExperiments, useCreateExperiment } from "@/hooks/use-experiments";
import { ExperimentList } from "@/components/experiments/experiment-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExperimentsPage() {
  const experiments = useExperiments();
  const createExperiment = useCreateExperiment();
  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    createExperiment.mutate(
      { name: name.trim(), hypothesis: hypothesis.trim() || undefined },
      {
        onSuccess: () => {
          setName("");
          setHypothesis("");
          setShowForm(false);
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experimentos A/B</h1>
          <p className="text-muted-foreground">
            Compare roteiros e descubra o que funciona melhor.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Experimento"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Experimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nome do experimento"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Hipotese (opcional)"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
            />
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createExperiment.isPending}
            >
              {createExperiment.isPending ? "Criando..." : "Criar"}
            </Button>
          </CardContent>
        </Card>
      )}

      <ExperimentList
        data={experiments.data}
        isLoading={experiments.isLoading}
        isError={experiments.isError}
      />
    </div>
  );
}
