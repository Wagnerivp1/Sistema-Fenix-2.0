
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getServiceOrders, saveServiceOrders, getCustomers } from '@/lib/storage';
import type { Customer, ServiceOrder } from '@/types';
import { NewOrderSheet } from '@/components/service-orders/new-order-sheet';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Aberta': return 'border-transparent bg-blue-500/20 text-blue-400';
        case 'Aguardando Pagamento': return 'border-transparent bg-red-500/20 text-red-400';
        case 'Aguardando peça': return 'border-transparent bg-yellow-500/20 text-yellow-400';
        case 'Em análise': return 'border-transparent bg-cyan-500/20 text-cyan-400';
        case 'Aprovado': return 'border-transparent bg-green-500/20 text-green-400';
        case 'Em conserto': return 'border-transparent bg-indigo-500/20 text-indigo-400';
        case 'Finalizado': return 'border-transparent bg-gray-500/20 text-gray-400';
        case 'Entregue': return 'border-transparent bg-purple-500/20 text-purple-400';
        case 'Aguardando': return 'border-transparent bg-orange-500/20 text-orange-400';
        default: return 'border-transparent bg-gray-700/50 text-gray-300';
    }
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Adiciona o fuso UTC para evitar problemas de timezone
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function ServiceOrdersPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const { toast } = useToast();
  
  const [orders, setOrders] = React.useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [editingOrder, setEditingOrder] = React.useState<ServiceOrder | null>(null);
  const [customerForNewOS, setCustomerForNewOS] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Load data from localStorage on mount
    const loadedOrders = getServiceOrders();
    const loadedCustomers = getCustomers();
    setOrders(loadedOrders);
    setCustomers(loadedCustomers);
    setIsLoading(false);

    if (customerId) {
      const customer = loadedCustomers.find(c => c.id === customerId);
      if (customer) {
        setCustomerForNewOS(customer);
        setEditingOrder(null);
        setIsSheetOpen(true);
      }
    }
  }, [customerId]);
  
  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen);
    // Limpa os estados ao fechar o sheet
    if (!isOpen) {
      setCustomerForNewOS(null);
      setEditingOrder(null);
    }
  }

  const handleEditClick = (order: ServiceOrder) => {
    setEditingOrder(order);
    setCustomerForNewOS(null);
    setIsSheetOpen(true);
  }

  const handleSaveOrder = (savedOrder: ServiceOrder) => {
    let updatedOrders;
    const orderExists = orders.some(o => o.id === savedOrder.id);

    if (orderExists) {
        updatedOrders = orders.map(o => o.id === savedOrder.id ? savedOrder : o);
         toast({
            title: 'Ordem de Serviço Atualizada!',
            description: 'Os dados da OS foram salvos com sucesso.',
        });
    } else {
        updatedOrders = [savedOrder, ...orders];
        toast({
            title: 'Ordem de Serviço Salva!',
            description: 'A nova ordem de serviço foi registrada com sucesso.',
        });
    }
    
    setOrders(updatedOrders);
    saveServiceOrders(updatedOrders); // Save to localStorage
    handleSheetOpenChange(false);
  }

  if (isLoading) {
    return <div>Carregando ordens de serviço...</div>;
  }

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
            <NewOrderSheet 
              customer={customerForNewOS}
              serviceOrder={editingOrder}
              isOpen={isSheetOpen}
              onOpenChange={handleSheetOpenChange}
              onSave={handleSaveOrder}
            />
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
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="hidden sm:table-cell">
                   <Link href="#" className="font-medium text-primary hover:underline">
                    #{order.id.slice(-4)}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{order.customerName}</TableCell>
                <TableCell>{order.equipment}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(order.date)}</TableCell>
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
                      <DropdownMenuItem onSelect={() => handleEditClick(order)}>Editar</DropdownMenuItem>
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
