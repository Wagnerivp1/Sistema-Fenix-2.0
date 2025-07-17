import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockServiceOrders } from '@/lib/data';
import { NewOrderSheet } from '@/components/service-orders/new-order-sheet';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Aberta': return 'bg-primary/20 text-primary-foreground border-primary/30';
        case 'Aguardando Pagamento': return 'bg-destructive/80 text-destructive-foreground border-destructive/90';
        case 'Aguardando peça': return 'bg-yellow-600/80 text-white border-yellow-700/90';
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>
              Gerencie as ordens de serviço.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-auto">
             <Select defaultValue="ativas">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativas">Status: Ativas</SelectItem>
                <SelectItem value="finalizadas">Status: Finalizadas</SelectItem>
                <SelectItem value="todas">Status: Todas</SelectItem>
              </SelectContent>
            </Select>
            <NewOrderSheet />
          </div>
        </div>
      </CardHeader>
      <CardContent>
         <div className="mb-4">
          <Input
            placeholder="Filtrar por cliente..."
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead className="hidden md:table-cell">Data de Entrada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockServiceOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="hidden sm:table-cell">
                   <Link href="#" className="font-medium text-primary hover:underline">
                    #...{order.id.slice(-4)}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{order.customerName}</TableCell>
                <TableCell>{order.equipment}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(order.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                   <Badge className={cn('font-semibold', getStatusVariant(order.status))} variant="outline">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
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
