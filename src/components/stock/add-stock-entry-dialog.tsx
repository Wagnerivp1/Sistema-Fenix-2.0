
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddStockEntryDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: StockItem, quantity: number) => void;
}

export function AddStockEntryDialog({ item, isOpen, onOpenChange, onSave }: AddStockEntryDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const [origin, setOrigin] = React.useState('compra');

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setOrigin('compra');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!item) return;
    if (quantity <= 0) {
      toast({ variant: 'destructive', title: 'Quantidade inválida', description: 'A quantidade deve ser maior que zero.' });
      return;
    }
    onSave(item, quantity);
  };
  
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Entrada no Estoque</DialogTitle>
          <DialogDescription>
            Adicionar novas unidades para o item <span className="font-semibold text-foreground">{item.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-end gap-4">
                <div className="space-y-2">
                    <Label>Estoque Atual</Label>
                    <Input value={item.quantity} disabled className="font-bold text-lg" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade a Adicionar</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="origin">Origem da Entrada</Label>
                <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger id="origin">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="compra">Compra de Fornecedor</SelectItem>
                        <SelectItem value="devolucao">Devolução de Cliente</SelectItem>
                        <SelectItem value="transferencia">Transferência Interna</SelectItem>
                        <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <div className="text-sm text-muted-foreground">
                Novo total será: <span className="font-bold text-foreground">{item.quantity + quantity}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Confirmar Entrada</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

