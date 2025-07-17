'use client';

import * as React from 'react';
import { PlusCircle, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockCustomers } from '@/lib/data';

export function NewOrderSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Adicionar OS
          </span>
           <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
              O
            </kbd>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-3xl w-full">
        <SheetHeader>
          <SheetTitle>Nova Ordem de Serviço</SheetTitle>
          <SheetDescription>
            Preencha os dados para registrar um novo atendimento.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-8">
          <div className="grid grid-cols-1 gap-4">
             <div>
                <Label htmlFor="customer">Selecione um cliente</Label>
                 <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Input id="type" placeholder="Ex: Notebook" />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" placeholder="Ex: Dell" />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" placeholder="Ex: Inspiron 15" />
            </div>
             <div>
              <Label htmlFor="serial">Nº de Série</Label>
              <Input id="serial" placeholder="Serial" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="accessories">Acessórios Entregues com o Equipamento</Label>
            <Textarea
              id="accessories"
              placeholder="Ex: Carregador original, mochila preta e adaptador HDMI."
            />
             <p className="text-sm text-muted-foreground">Descreva todos os acessórios que o cliente deixou junto com o equipamento.</p>
          </div>
           <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="problem">Defeito Reclamado</Label>
            <Textarea
              id="problem"
              placeholder="Descrição detalhada do problema informado pelo cliente."
            />
          </div>

        </div>
        <SheetFooter className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 <Button variant="outline"><Printer />Gerar Orçamento</Button>
                 <Button variant="outline"><Printer />Reimprimir OS</Button>
                 <Button variant="outline"><FileText />Recibo de Entrada</Button>
                 <Button variant="outline"><FileText />Recibo de Entrega</Button>
            </div>
            <div className="flex gap-2 justify-end">
                <SheetClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </SheetClose>
                <SheetClose asChild>
                    <Button type="submit">Salvar Ordem de Serviço</Button>
                </SheetClose>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
