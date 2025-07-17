import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Archive } from "lucide-react";

export default function EstoquePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estoque</CardTitle>
        <CardDescription>
          Módulo de controle de estoque.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <Archive className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Módulo em Desenvolvimento</h3>
        <p className="text-muted-foreground">A funcionalidade de Controle de Estoque estará disponível em breve.</p>
      </CardContent>
    </Card>
  )
}
