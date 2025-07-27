
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
import { Textarea } from '@/components/ui/textarea';
import type { StockItem } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

interface EditStockItemDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: StockItem) => void;
}

const initialItemState: Omit<StockItem, 'id'> = {
  name: '',
  description: '',
  category: '',
  quantity: 0,
  price: 0,
  costPrice: 0,
  minStock: 0,
  barcode: '',
  unitOfMeasure: 'UN'
};

export function EditStockItemDialog({ item, isOpen, onOpenChange, onSave }: EditStockItemDialogProps) {
  const [formData, setFormData] = React.useState<Partial<StockItem>>(initialItemState);

  React.useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData(item);
      } else {
        setFormData(initialItemState);
      }
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const isNumberField = ['price', 'costPrice', 'quantity', 'minStock'].includes(id);
    setFormData(prev => ({ ...prev, [id]: isNumberField ? parseFloat(value) || 0 : value }));
  };

  const handleSave = () => {
    const id = item?.id || `PROD-${Date.now()}`;
    const barcode = formData.barcode || id;
    onSave({ ...initialItemState, ...formData, id, barcode } as StockItem);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          <DialogDescription>
            {item ? `Altere os dados do produto ${item.name}.` : 'Preencha os detalhes do novo produto ou peça.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="grid gap-4 py-4 px-6">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" placeholder="Ex: SSD Kingston 240GB" value={formData.name || ''} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Informações detalhadas sobre o produto..." value={formData.description || ''} onChange={handleChange} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" placeholder="Ex: Peças, Periféricos" value={formData.category || ''} onChange={handleChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input id="barcode" placeholder="Deixe em branco para gerar" value={formData.barcode || ''} onChange={handleChange} />
                </div>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Preço de Venda (R$)</Label>
                    <Input id="price" type="number" value={formData.price || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                    <Input id="costPrice" type="number" value={formData.costPrice || ''} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="quantity">Qtd. em Estoque</Label>
                    <Input id="quantity" type="number" value={formData.quantity || ''} onChange={handleChange} />
                </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 pb-4 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Produto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
