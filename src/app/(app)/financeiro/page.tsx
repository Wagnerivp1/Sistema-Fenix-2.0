import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

export default function FinanceiroPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financeiro</CardTitle>
        <CardDescription>
          Módulo de controle financeiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <CircleDollarSign className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Módulo em Desenvolvimento</h3>
        <p className="text-muted-foreground">A funcionalidade de Controle Financeiro estará disponível em breve.</p>
      </CardContent>
    </Card>
  )
}
