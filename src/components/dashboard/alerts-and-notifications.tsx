
'use client';
import Link from 'next/link';
import { AlertTriangle, Download, Archive, WalletCards } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import type { StockItem, FinancialTransaction } from '@/types';
import { getStock, getFinancialTransactions } from '@/lib/storage';

export function AlertsAndNotifications() {
  const [lowStockItems, setLowStockItems] = React.useState<StockItem[]>([]);
  const [pendingPayments, setPendingPayments] = React.useState<FinancialTransaction[]>([]);

  const checkAlerts = React.useCallback(async () => {
    // Check stock levels
    const stock = await getStock();
    const lowItems = stock.filter(item => item.quantity <= item.minStock && item.minStock > 0);
    setLowStockItems(lowItems);
    
    // Check for pending payments
    const transactions = await getFinancialTransactions();
    const pending = transactions.filter(tx => tx.status === 'pendente');
    setPendingPayments(pending);

  }, []);

  React.useEffect(() => {
    checkAlerts();
    // Listen for storage changes that might affect alerts
    window.addEventListener('storage-change-stock', checkAlerts);
    window.addEventListener('storage-change-financialTransactions', checkAlerts);
    
    return () => {
        window.removeEventListener('storage-change-stock', checkAlerts);
        window.removeEventListener('storage-change-financialTransactions', checkAlerts);
    };
  }, [checkAlerts]);

  const hasAlerts = lowStockItems.length > 0 || pendingPayments.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
        <CardDescription>Avisos importantes do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        {lowStockItems.length > 0 && (
          <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h4 className="font-semibold text-destructive">Estoque Baixo</h4>
                <p className="text-sm text-destructive/80">
                  {lowStockItems.length} item(ns) atingiram o estoque mínimo.
                </p>
                <Button variant="link" asChild className="p-0 h-auto mt-1 text-destructive">
                   <Link href="/produtos">Verificar Produtos</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
         {pendingPayments.length > 0 && (
          <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <WalletCards className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-yellow-700">Pagamentos Pendentes</h4>
                <p className="text-sm text-yellow-600/80">
                  Existem {pendingPayments.length} parcelas aguardando pagamento.
                </p>
                <Button variant="link" asChild className="p-0 h-auto mt-1 text-yellow-700">
                   <Link href="/financeiro?type=contas_a_receber">Ver no Financeiro</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        {!hasAlerts && (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
