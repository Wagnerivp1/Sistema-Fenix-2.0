
'use client';
import Link from 'next/link';
import { AlertTriangle, Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStock } from '@/lib/storage';
import * as React from 'react';

export function AlertsAndNotifications() {
    const [lowStockCount, setLowStockCount] = React.useState(0);

    React.useEffect(() => {
        const fetchStockAlerts = async () => {
            const stock = await getStock();
            const lowStockItems = stock.filter(item => item.minStock && item.quantity <= item.minStock);
            setLowStockCount(lowStockItems.length);
        };
        fetchStockAlerts();
    }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
        <CardDescription>Avisos importantes do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        {lowStockCount > 0 ? (
            <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
               <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                  <div>
                      <p className="font-semibold text-destructive">{lowStockCount} Produto(s) com baixo estoque</p>
                      <p className="text-sm text-destructive/80">
                        Verifique seu inventário para evitar falta de peças.
                      </p>
                       <Button variant="link" className="p-0 h-auto text-destructive/90 hover:text-destructive" asChild>
                         <Link href="/estoque?filter=low_stock">Ver estoque</Link>
                      </Button>
                  </div>
                </div>
            </div>
        ) : (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
