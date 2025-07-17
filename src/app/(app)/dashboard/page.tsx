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

export default function DashboardPage() {
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
