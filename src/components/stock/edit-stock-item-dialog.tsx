
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Barcode from 'react-barcode';

interface EditStockItemDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: StockItem) => void;
}

const initialFormData: Partial<StockItem> = {
    name: '',
    category: '',
    description: '',
    unitOfMeasure: 'UN',
    barcode: '',
    costPrice: 0,
    price: 0,
    quantity: 0,
    minStock: 0,
};

export function EditStockItemDialog({ item, isOpen, onOpenChange, onSave }: EditStockItemDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<StockItem>>(initialFormData);
  const isEditing = !!item;

  React.useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData(item);
      } else {
        const newId = `PROD-${Date.now()}`;
        setFormData({ ...initialFormData, id: newId, barcode: newId });
      }
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const isNumberField = ['costPrice', 'price', 'quantity', 'minStock'].includes(id);
    setFormData(prev => ({ ...prev, [id]: isNumberField ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (id: keyof StockItem, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'Nome do produto e preço de venda são obrigatórios.' });
      return;
    }

    const finalItem: StockItem = {
      id: formData.id!,
      barcode: formData.id!, // Use ID as barcode
      name: formData.name!,
      price: formData.price || 0,
      quantity: isEditing ? item.quantity : (formData.quantity || 0),
      ...formData
    };
    onSave(finalItem);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 flex-shrink-0 border-b">
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Altere os dados de "${item?.name}".` : 'Preencha as informações do novo item de estoque.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0">
            <div className="grid gap-6 p-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="name">Nome do Produto</Label>
                        <Input id="name" value={formData.name || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Input id="category" placeholder="Ex: Componentes" value={formData.category || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descrição Detalhada</Label>
                    <Textarea id="description" value={formData.description || ''} onChange={handleChange} rows={2} />
                </div>
                <div className="grid grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="unitOfMeasure">Unidade</Label>
                        <Select value={formData.unitOfMeasure || 'UN'} onValueChange={(v) => handleSelectChange('unitOfMeasure', v)}>
                            <SelectTrigger id="unitOfMeasure">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UN">Unidade (UN)</SelectItem>
                                <SelectItem value="KG">Quilograma (KG)</SelectItem>
                                <SelectItem value="L">Litro (L)</SelectItem>
                                <SelectItem value="M">Metro (M)</SelectItem>
                                <SelectItem value="CX">Caixa (CX)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label htmlFor="barcode">Código de Barras</Label>
                        <Input id="barcode" value={formData.barcode || 'Gerado automaticamente'} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                        <Input id="costPrice" type="number" value={formData.costPrice || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Preço de Venda (R$)</Label>
                        <Input id="price" type="number" value={formData.price || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade Inicial</Label>
                        <Input id="quantity" type="number" value={isEditing ? item.quantity : (formData.quantity || '')} onChange={handleChange} disabled={isEditing} />
                        {isEditing && <p className="text-xs text-muted-foreground">Use "Adicionar Entrada" para alterar o estoque.</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="minStock">Estoque Mínimo</Label>
                        <Input id="minStock" type="number" value={formData.minStock || ''} onChange={handleChange} />
                    </div>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="p-6 border-t flex-shrink-0 bg-card sm:justify-between items-center">
            <div className="flex-shrink-0">
                {formData.barcode ? (
                    <Barcode value={formData.barcode} height={40} fontSize={10} width={1.5} />
                ) : (
                    <div className="h-[40px] flex items-center text-xs text-muted-foreground">Aguardando ID do produto para gerar o código.</div>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Produto</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
