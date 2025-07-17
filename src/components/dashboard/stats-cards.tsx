import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wrench, CheckCircle, Archive } from 'lucide-react';
import { mockCustomers, mockServiceOrders } from '@/lib/data';

export function StatsCards() {
  const activeOrders = mockServiceOrders.filter(
    (order) => !['Finalizado', 'Entregue', 'Cancelada'].includes(order.status)
  ).length;

  const completedOrders = mockServiceOrders.filter(
    (order) => ['Finalizado', 'Entregue'].includes(order.status)
  ).length;
  
  const totalCustomers = mockCustomers.length;
  
  // Mock data for low stock items
  const lowStockItems = 2;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeOrders}</div>
          <p className="text-xs text-muted-foreground">Ordens de serviço ativas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Concluídas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <p className="text-xs text-muted-foreground">Total de serviços entregues</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <p className="text-xs text-muted-foreground">Total de clientes cadastrados</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItems}</div>
          <p className="text-xs text-muted-foreground">Itens que precisam de reposição</p>
        </CardContent>
      </Card>
    </>
  );
}
