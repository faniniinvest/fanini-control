// _columns/platform-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date;
  platform: string;
}

interface PlatformButtonsProps {
  client: Client;
  onStartEvaluation: (id: string) => void;
}

export function PlatformButtons({
  client,
  onStartEvaluation,
}: PlatformButtonsProps) {
  const { toast } = useToast();

  const handleStartEvaluation = async () => {
    try {
      if (!client.id) {
        throw new Error("ID do cliente não encontrado");
      }

      // Chama diretamente a função para atualizar o status no banco
      onStartEvaluation(client.id);

      toast({
        title: "Sucesso",
        description: "Plataforma liberada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao liberar plataforma:", error);
      toast({
        title: "Erro",
        description: "Falha ao liberar plataforma",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleStartEvaluation}
      variant="outline"
      size="sm"
      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
    >
      <Play className="h-4 w-4 mr-2" />
      Liberar Plataforma
    </Button>
  );
}
