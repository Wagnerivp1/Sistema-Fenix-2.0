import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>
          Módulo de configurações do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <Settings className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Módulo em Desenvolvimento</h3>
        <p className="text-muted-foreground">As Configurações do Sistema estarão disponíveis em breve.</p>
      </CardContent>
    </Card>
  )
}
