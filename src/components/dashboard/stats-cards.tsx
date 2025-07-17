import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wrench, CircleDollarSign, ArrowUpRight } from 'lucide-react';
import { mockCustomers, mockServiceOrders } from '@/lib/data';

export function StatsCards() {
  const activeOrders = mockServiceOrders.filter(
    (order) => !['Finalizado', 'Entregue'].includes(order.status)
  ).length;
  
  const monthlySales = mockServiceOrders.reduce((sum, order) => sum + order.totalValue, 0);
  const totalCustomers = mockCustomers.length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ordens Ativas</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeOrders}</div>
          <p className="text-xs text-muted-foreground">+2 desde ontem</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {monthlySales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">+12.5% em relação ao mês passado</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <p className="text-xs text-muted-foreground">+5 novos clientes este mês</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+7.2%</div>
          <p className="text-xs text-muted-foreground">Performance geral do negócio</p>
        </CardContent>
      </Card>
    </>
  );
}
