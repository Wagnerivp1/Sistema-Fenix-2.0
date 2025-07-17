import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function VendasPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas / PDV</CardTitle>
        <CardDescription>
          Módulo de vendas e ponto de venda.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Módulo em Desenvolvimento</h3>
        <p className="text-muted-foreground">A funcionalidade de Ponto de Venda estará disponível em breve.</p>
      </CardContent>
    </Card>
  )
}
