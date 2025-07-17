
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Customer } from '@/types';

interface EditCustomerDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (customer: Customer) => void;
}

export function EditCustomerDialog({ customer, isOpen, onOpenChange, onSave }: EditCustomerDialogProps) {
  const [formData, setFormData] = React.useState<Partial<Customer>>({});

  React.useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (customer) {
      onSave({ ...customer, ...formData });
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Altere os dados de {customer.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={formData.name || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="email">E-mail (Opcional)</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={formData.address || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="cpf">CPF / CNPJ (Opcional)</Label>
              {/* Usando o ID do cliente como placeholder para o documento */}
              <Input id="cpf" value={formData.id?.split('-')[1] || ''} onChange={handleChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
