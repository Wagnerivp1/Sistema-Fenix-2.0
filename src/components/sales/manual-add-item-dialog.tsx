
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
import type { SaleItem } from '@/types';

interface ManualAddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: SaleItem) => void;
}

const initialItemState = { name: '', price: 0, quantity: 1 };

export function ManualAddItemDialog({ isOpen, onOpenChange, onAddItem }: ManualAddItemDialogProps) {
  const [item, setItem] = React.useState(initialItemState);

  React.useEffect(() => {
    if (isOpen) {
      setItem(initialItemState);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setItem(prev => ({
      ...prev,
      [id]: id === 'name' ? value : parseFloat(value) || 0,
    }));
  };

  const handleAdd = () => {
    if (item.name && item.price > 0 && item.quantity > 0) {
      onAddItem({ ...item, id: `manual-${Date.now()}` });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Item Manualmente</DialogTitle>
          <DialogDescription>
            Insira os dados do produto ou serviço que não está no catálogo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Descrição do Item</Label>
            <Input id="name" placeholder="Ex: Formatação de PC" value={item.name} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="price">Preço Unitário (R$)</Label>
                <Input id="price" type="number" value={item.price || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" type="number" value={item.quantity} onChange={handleChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAdd}>Adicionar à Venda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
