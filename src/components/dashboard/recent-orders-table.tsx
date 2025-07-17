import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockServiceOrders } from '@/lib/data';
import { cn } from '@/lib/utils';

const statusVariantMap: { [key in ServiceOrderStatus]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  'Recebido': 'outline',
  'Em análise': 'secondary',
  'Aprovado': 'default',
  'Em conserto': 'default',
  'Finalizado': 'default',
  'Entregue': 'default',
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Recebido': return 'bg-yellow-200 text-yellow-800';
        case 'Em análise': return 'bg-blue-200 text-blue-800';
        case 'Aprovado': return 'bg-green-200 text-green-800';
        case 'Em conserto': return 'bg-indigo-200 text-indigo-800';
        case 'Finalizado': return 'bg-gray-200 text-gray-800';
        case 'Entregue': return 'bg-purple-200 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

type ServiceOrderStatus = 'Recebido' | 'Em análise' | 'Aprovado' | 'Em conserto' | 'Finalizado' | 'Entregue';

export function RecentOrdersTable() {
  const recentOrders = [...mockServiceOrders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <Card className="xl:col-span-1 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Ordens de Serviço Recentes</CardTitle>
          <CardDescription>
            As últimas 5 ordens de serviço cadastradas.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/ordens-de-servico">
            Ver Todas
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {order.equipment}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={cn('font-semibold', getStatusVariant(order.status))} variant="outline">
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
