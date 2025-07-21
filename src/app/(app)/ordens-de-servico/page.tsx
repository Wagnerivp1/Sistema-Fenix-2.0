
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { MoreHorizontal, Undo2, MessageSquare } from 'lucide-react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { getServiceOrders, saveServiceOrders, getCustomers } from '@/lib/storage';
import type { Customer, ServiceOrder } from '@/types';
import { NewOrderSheet } from '@/components/service-orders/new-order-sheet';
import { ViewCommentsDialog } from '@/components/service-orders/view-comments-dialog';
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

const allStatuses: ServiceOrder['status'][] = [
  'Aberta', 
  'Em análise', 
  'Aguardando',
  'Aguardando peça',
  'Aguardando Pagamento',
  'Aprovado',
  'Em conserto',
  'Finalizado', 
  'Entregue', 
  'Cancelada'
];

export default function ServiceOrdersPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const { toast } = useToast();
  
  const [orders, setOrders] = React.useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [editingOrder, setEditingOrder] = React.useState<ServiceOrder | null>(null);
  const [commentsOrder, setCommentsOrder] = React.useState<ServiceOrder | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = React.useState(false);
  const [customerForNewOS, setCustomerForNewOS] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('ativas');
  const [searchFilter, setSearchFilter] = React.useState('');

  React.useEffect(() => {
    // Load data from localStorage on mount
    const loadedOrders = getServiceOrders();
    const loadedCustomers = getCustomers();
    setOrders(loadedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setCustomers(loadedCustomers);
    setIsLoading(false);

    if (customerId) {
      const customer = loadedCustomers.find(c => c.id === customerId);
      if (customer) {
        handleNewOrderClick(customer);
      }
    }
  }, [customerId]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'o' && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT' && !target.isContentEditable) {
          event.preventDefault();
          handleNewOrderClick();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleNewOrderClick = (customer?: Customer | null) => {
    if (customer) {
      setCustomerForNewOS(customer);
    } else {
      setCustomerForNewOS(null);
    }
    setEditingOrder(null);
    setIsSheetOpen(true);
  }
  
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

  const handleViewCommentsClick = (order: ServiceOrder) => {
    setCommentsOrder(order);
    setIsCommentsDialogOpen(true);
  }

  const handleSaveOrder = (savedOrder: ServiceOrder) => {
    let updatedOrders;
    const orderExists = orders.some(o => o.id === savedOrder.id);
    const finalOrder = { ...savedOrder };

    // Se o status for 'Entregue' e não houver data de entrega, defina-a
    if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
      finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
    }
    // Se o status não for mais 'Entregue', limpe a data de entrega
    else if (finalOrder.status !== 'Entregue') {
      delete finalOrder.deliveredDate;
    }

    if (orderExists) {
        updatedOrders = orders.map(o => o.id === finalOrder.id ? finalOrder : o);
         toast({
            title: 'Ordem de Serviço Atualizada!',
            description: 'Os dados da OS foram salvos com sucesso.',
        });
    } else {
        updatedOrders = [finalOrder, ...orders];
        toast({
            title: 'Ordem de Serviço Salva!',
            description: 'A nova ordem de serviço foi registrada com sucesso.',
        });
    }
    
    setOrders(updatedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    saveServiceOrders(updatedOrders); // Save to localStorage
    handleSheetOpenChange(false);
  }

  const handleReopenOrder = (orderId: string) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'Aberta' as const } : o
    );
    setOrders(updatedOrders);
    saveServiceOrders(updatedOrders);
    toast({
      title: 'Ordem de Serviço Reaberta!',
      description: `A OS #${orderId.slice(-4)} foi movida para o status "Aberta".`,
    });
  };

  const filteredOrders = React.useMemo(() => {
    let result = [...orders];

    if (statusFilter === 'ativas') {
      result = result.filter(o => o.status !== 'Finalizado' && o.status !== 'Entregue');
    } else if (statusFilter === 'finalizadas') {
      result = result.filter(o => o.status === 'Finalizado' || o.status === 'Entregue');
    } else if (statusFilter !== 'todas') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (searchFilter) {
      result = result.filter(o => 
        o.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        o.equipment.toLowerCase().includes(searchFilter.toLowerCase()) ||
        o.id.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    return result;
  }, [orders, statusFilter, searchFilter]);

  if (isLoading) {
    return <div>Carregando ordens de serviço...</div>;
  }

  return (
    <>
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
             <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Visualizações Gerais</SelectLabel>
                  <SelectItem value="ativas">Status: Ativas</SelectItem>
                  <SelectItem value="finalizadas">Status: Finalizadas</SelectItem>
                  <SelectItem value="todas">Status: Todas</SelectItem>
                </SelectGroup>
                 <SelectGroup>
                  <SelectLabel>Status Específicos</SelectLabel>
                   {allStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <NewOrderSheet 
              onNewOrderClick={handleNewOrderClick}
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
            placeholder="Filtrar por cliente, equipamento ou nº OS..."
            className="max-w-sm"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
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
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
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
                      <DropdownMenuItem onSelect={() => handleEditClick(order)}>Editar Detalhes</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleViewCommentsClick(order)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Exibir Comentários
                      </DropdownMenuItem>
                      <DropdownMenuItem>Imprimir</DropdownMenuItem>
                      {(order.status === 'Finalizado' || order.status === 'Entregue') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleReopenOrder(order.id)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Reabrir OS
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
            ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma ordem de serviço encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <ViewCommentsDialog 
      isOpen={isCommentsDialogOpen}
      onOpenChange={setIsCommentsDialogOpen}
      serviceOrder={commentsOrder}
    />
    </>
  );
}
