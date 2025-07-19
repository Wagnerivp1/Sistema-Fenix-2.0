
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, ArrowUpDown, Check, ChevronsUpDown, User, Phone, Mail, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { mockCustomers, mockServiceOrders } from '@/lib/data';
import type { Customer, ServiceOrder } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';
import { ServiceHistory } from '@/components/customers/service-history';

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customerServiceHistory, setCustomerServiceHistory] = React.useState<ServiceOrder[]>([]);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      const history = mockServiceOrders.filter(
        (order) => order.customerName.toLowerCase() === customer.name.toLowerCase()
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCustomerServiceHistory(history);
    } else {
      setCustomerServiceHistory([]);
    }
  };
  
  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setSelectedCustomer(updatedCustomer);
    toast({
      title: 'Cliente atualizado!',
      description: `Os dados de ${updatedCustomer.name} foram salvos.`,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setSelectedCustomer(null);
    setCustomerServiceHistory([]);
    toast({
      title: 'Cliente excluído!',
      description: 'O cliente foi removido do sistema.',
      variant: 'destructive',
    });
  };
  
  const handleOpenServiceOrder = () => {
    if (selectedCustomer) {
      router.push(`/ordens-de-servico?customerId=${selectedCustomer.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                Gerencie seus clientes e consulte o histórico de atendimentos.
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                   <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    N
                  </kbd>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo cliente abaixo.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                   <div className="grid grid-cols-1 gap-6">
                      <div>
                          <Label htmlFor="name">Nome Completo</Label>
                          <Input id="name" placeholder="John Doe" />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                      <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input id="phone" placeholder="(99) 99999-9999" />
                      </div>
                      <div>
                          <Label htmlFor="email">E-mail (Opcional)</Label>
                          <Input id="email" type="email" placeholder="email@exemplo.com" />
                      </div>
                  </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                          <Label htmlFor="address">Endereço</Label>
                          <Input id="address" placeholder="Rua Exemplo, 123" />
                      </div>
                      <div>
                          <Label htmlFor="cpf">CPF / CNPJ (Opcional)</Label>
                          <Input id="cpf" placeholder="Apenas números" />
                      </div>
                  </div>
                </div>
                <DialogFooter className="justify-end gap-2">
                   <Button variant="ghost">Cancelar</Button>
                   <Button variant="outline">Salvar</Button>
                   <Button type="submit">Salvar e Gerar OS</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full md:w-[400px] justify-between"
                >
                  {selectedCustomer
                    ? selectedCustomer.name
                    : 'Selecione ou pesquise um cliente...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Procurar cliente..." 
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={(currentValue) => {
                             const cust = customers.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                             handleSelectCustomer(cust || null);
                             setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCustomer?.name.toLowerCase() === customer.name.toLowerCase() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {customer.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
      
      {selectedCustomer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dados do Cliente</CardTitle>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                        Editar Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleOpenServiceOrder}>
                        Abrir Nova Ordem de Serviço
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            Excluir Cliente
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todo seu histórico de atendimentos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCustomer(selectedCustomer.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedCustomer.email || 'Não informado'}</span>
                  </div>
                   <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                    <span className="flex-1">{selectedCustomer.address || 'Não informado'}</span>
                  </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                  Último atendimento em: {customerServiceHistory.length > 0 ? new Date(customerServiceHistory[0].date).toLocaleDateString('pt-BR') : 'Nenhum'}
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <ServiceHistory history={customerServiceHistory} />
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold mt-4">Nenhum cliente selecionado</h3>
            <p className="text-muted-foreground">Selecione um cliente acima para ver seus dados e histórico.</p>
          </CardContent>
        </Card>
      )}

      {selectedCustomer && (
        <EditCustomerDialog
          customer={selectedCustomer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdateCustomer}
        />
      )}
    </div>
  );
}
