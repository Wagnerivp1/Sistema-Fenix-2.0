
'use client';
import Link from 'next/link';
import { AlertTriangle, Download, Archive } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import type { StockItem } from '@/types';
import { getStock } from '@/lib/storage';
import { differenceInHours } from 'date-fns';

export function AlertsAndNotifications() {
  const [lowStockItems, setLowStockItems] = React.useState<StockItem[]>([]);
  const [backupNeeded, setBackupNeeded] = React.useState(false);

  const checkAlerts = React.useCallback(async () => {
    // Check stock levels
    const stock = await getStock();
    const lowItems = stock.filter(item => item.quantity <= item.minStock && item.minStock > 0);
    setLowStockItems(lowItems);

    // Check last backup time
    if (typeof window !== 'undefined') {
        const lastBackupTime = localStorage.getItem('lastBackupTime');
        if (!lastBackupTime) {
            setBackupNeeded(true);
        } else {
            const hoursSinceBackup = differenceInHours(new Date(), new Date(lastBackupTime));
            if (hoursSinceBackup >= 24) {
                setBackupNeeded(true);
            } else {
                setBackupNeeded(false);
            }
        }
    }
  }, []);

  React.useEffect(() => {
    checkAlerts();
    // Listen for storage changes that might affect alerts
    window.addEventListener('storage-change-stock', checkAlerts);
    window.addEventListener('storage-change-lastBackupTime', checkAlerts);
    
    return () => {
        window.removeEventListener('storage-change-stock', checkAlerts);
        window.removeEventListener('storage-change-lastBackupTime', checkAlerts);
    };
  }, [checkAlerts]);

  const hasAlerts = lowStockItems.length > 0 || backupNeeded;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
        <CardDescription>Avisos importantes do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        {backupNeeded && (
          <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-yellow-500" />
              <div>
                <h4 className="font-semibold text-yellow-400">Lembrete de Backup</h4>
                <p className="text-sm text-yellow-400/80">
                  Faz mais de 24 horas desde o seu último backup.
                </p>
                <Button variant="link" asChild className="p-0 h-auto mt-1 text-yellow-400">
                   <Link href="/configuracoes">Fazer Backup Agora</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
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
        {!hasAlerts && (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
