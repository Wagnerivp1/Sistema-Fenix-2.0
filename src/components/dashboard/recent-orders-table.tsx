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
import { mockServiceOrders } from '@/lib/data';
import { cn } from '@/lib/utils';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Aberta': return 'bg-primary/80 text-primary-foreground';
        case 'Aguardando Pagamento': return 'bg-destructive/80 text-destructive-foreground';
        case 'Aguardando peça': return 'bg-yellow-600/80 text-white';
        case 'Em análise': return 'bg-blue-900 text-blue-300';
        case 'Aprovado': return 'bg-green-900 text-green-300';
        case 'Em conserto': return 'bg-indigo-900 text-indigo-300';
        case 'Finalizado': return 'bg-gray-700 text-gray-300';
        case 'Entregue': return 'bg-purple-900 text-purple-300';
        case 'Aguardando': return 'bg-yellow-600/80 text-white';
        default: return 'bg-gray-800 text-gray-400';
    }
}


export function RecentOrdersTable() {
  const recentOrders = [...mockServiceOrders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Últimas Ordens de Serviço</CardTitle>
        <CardDescription>
          As 5 mais recentes ordens de serviço.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border last:border-b-0">
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.equipment} - {order.reportedProblem}</p>
                </div>
                <Badge className={cn('font-semibold', getStatusVariant(order.status))} variant="outline">
                    {order.status}
                </Badge>
              </div>
            ))}
          </div>
      </CardContent>
    </Card>
  );
}
