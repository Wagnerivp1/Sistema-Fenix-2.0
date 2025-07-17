import { MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockServiceOrders } from '@/lib/data';
import { NewOrderSheet } from '@/components/service-orders/new-order-sheet';
import { cn } from '@/lib/utils';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Recebido': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
        case 'Em análise': return 'bg-blue-900 text-blue-300 border-blue-700';
        case 'Aprovado': return 'bg-green-900 text-green-300 border-green-700';
        case 'Em conserto': return 'bg-indigo-900 text-indigo-300 border-indigo-700';
        case 'Finalizado': return 'bg-gray-700 text-gray-300 border-gray-500';
        case 'Entregue': return 'bg-purple-900 text-purple-300 border-purple-700';
        default: return 'bg-gray-800 text-gray-400 border-gray-600';
    }
}

export default function ServiceOrdersPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>
              Acompanhe e gerencie todas as ordens de serviço.
            </CardDescription>
          </div>
          <NewOrderSheet />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockServiceOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="hidden sm:table-cell font-medium">{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell className="font-medium">{order.equipment}</TableCell>
                <TableCell className="hidden md:table-cell">
                   <Badge className={cn('font-semibold', getStatusVariant(order.status))} variant="outline">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{new Date(order.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">R$ {order.totalValue.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Imprimir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
