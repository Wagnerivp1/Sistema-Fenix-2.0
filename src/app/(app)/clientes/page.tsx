
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, ArrowUpDown, Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
import { mockCustomers } from '@/lib/data';
import type { Customer } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleSearch = (searchQuery: string) => {
    const customer = customers.find(c => c.name.toLowerCase() === searchQuery.toLowerCase());
    setSelectedCustomer(customer || null);
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
    toast({
      title: 'Cliente excluído!',
      description: 'O cliente foi removido do sistema.',
      variant: 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Gerencie seus clientes cadastrados.
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
                className="w-[300px] justify-between"
              >
                {selectedCustomer
                  ? selectedCustomer.name
                  : 'Selecione um cliente...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Procurar cliente..." 
                  onValueChange={handleSearch}
                 />
                <CommandList>
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={(currentValue) => {
                           handleSearch(currentValue);
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  Nome
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Documento</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCustomer ? (
              <TableRow key={selectedCustomer.id}>
                <TableCell className="font-medium">{selectedCustomer.name}</TableCell>
                <TableCell>{selectedCustomer.email}</TableCell>
                <TableCell className="hidden md:table-cell">{selectedCustomer.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{selectedCustomer.id.split('-')[1]}</TableCell>
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
                      <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                        Editar Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push('/ordens-de-servico')}>
                        Abrir Ordem de Serviço
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente
                              <span className="font-bold"> {selectedCustomer.name}</span>.
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
                </TableCell>
              </TableRow>
            ) : (
               <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum cliente selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {selectedCustomer && (
          <EditCustomerDialog
            customer={selectedCustomer}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleUpdateCustomer}
          />
        )}
      </CardContent>
    </Card>
  );
}
