
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import { mockCustomers } from '@/lib/data';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCustomers = mockCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" placeholder="Opcional" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" placeholder="Rua Exemplo, 123" />
                    </div>
                    <div>
                        <Label htmlFor="cpf">CPF / CNPJ</Label>
                        <Input id="cpf" placeholder="Opcional" />
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
          <Input
            placeholder="Filtrar por nome..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell className="hidden md:table-cell">{customer.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{customer.id.split('-')[1]}</TableCell>
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
                      <DropdownMenuItem>Editar Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Abrir Ordem de Serviço</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Excluir
                      </DropdownMenuItem>
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
