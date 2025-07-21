
'use client';

import * as React from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { AlertsAndNotifications } from '@/components/dashboard/alerts-and-notifications';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { toast } = useToast();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return; // Add safety check for event.key

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key.toUpperCase();

      if (event.key === 'F2') {
        event.preventDefault();
        toast({ title: 'Atalho F2', description: 'Funcionalidade "Nova Venda" ainda não implementada.' });
      } else if (event.shiftKey && key === 'R') {
        event.preventDefault();
        toast({ title: 'Atalho Shift+R', description: 'Funcionalidade "Adicionar Receita" ainda não implementada.' });
      } else if (event.shiftKey && key === 'D') {
        event.preventDefault();
        toast({ title: 'Atalho Shift+D', description: 'Funcionalidade "Adicionar Despesa" ainda não implementada.' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Venda
            <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              F2
            </kbd>
          </Button>
          <Button variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Receita
             <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              Shift+R
            </kbd>
          </Button>
          <Button variant="destructive">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Despesa
             <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              Shift+D
            </kbd>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-8">
        <div className="lg:col-span-2">
           <RecentOrdersTable />
        </div>
        <div className="lg:col-span-1">
          <AlertsAndNotifications />
        </div>
      </div>
    </div>
  );
}
