
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wrench, CheckCircle, Archive, CircleDollarSign } from 'lucide-react';
import { getCustomers, getServiceOrders, getStock, getFinancialTransactions } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
    dataVersion: number;
}

export function StatsCards({ dataVersion }: StatsCardsProps) {
  const [stats, setStats] = React.useState({
    activeOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    totalBalance: 0,
  });
  
  React.useEffect(() => {
    const fetchStats = async () => {
      const [serviceOrders, customers, stock, transactions] = await Promise.all([
        getServiceOrders(),
        getCustomers(),
        getStock(),
        getFinancialTransactions()
      ]);

      const activeOrders = serviceOrders.filter(
        (order) => !['Finalizado', 'Entregue', 'Cancelada'].includes(order.status)
      ).length;

      const completedOrders = serviceOrders.filter(
        (order) => ['Finalizado', 'Entregue'].includes(order.status)
      ).length;
      
      const totalCustomers = customers.length;
      
      const lowStockItems = stock.filter(item => item.minStock && item.quantity <= item.minStock).length;
      
      const totalBalance = transactions.reduce((acc, t) => {
        return t.type === 'receita' ? acc + t.amount : acc - t.amount;
      }, 0);

      setStats({
        activeOrders,
        completedOrders,
        totalCustomers,
        lowStockItems,
        totalBalance,
      });
    };

    fetchStats();
  }, [dataVersion]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeOrders}</div>
          <p className="text-xs text-muted-foreground">Ordens de serviço ativas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">Total de clientes cadastrados</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.lowStockItems}</div>
          <p className="text-xs text-muted-foreground">Itens que precisam de reposição</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn(
                'text-2xl font-bold',
                stats.totalBalance >= 0 ? 'text-green-500' : 'text-destructive'
              )}>
            R$ {stats.totalBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Balanço geral de receitas e despesas</p>
        </CardContent>
      </Card>
    </>
  );
}
