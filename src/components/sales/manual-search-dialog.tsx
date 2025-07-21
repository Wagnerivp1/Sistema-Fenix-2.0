
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

interface ManualSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stockItems: StockItem[];
  onProductSelect: (product: StockItem) => void;
}

export function ManualSearchDialog({
  isOpen,
  onOpenChange,
  stockItems,
  onProductSelect,
}: ManualSearchDialogProps) {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = React.useState('');

  const filteredStock = React.useMemo(() => {
    if (!searchValue) return stockItems;
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [stockItems, searchValue]);

  const handleSelect = (productName: string) => {
    const product = stockItems.find(item => item.name === productName);
    if (!product) return;

    if (product.quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Fora de Estoque',
        description: `O produto "${product.name}" não tem estoque disponível.`,
      });
    } else {
      onProductSelect(product);
    }
    onOpenChange(false);
  };
  
  React.useEffect(() => {
    if(!isOpen) {
      setSearchValue('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0" onInteractOutside={(e) => e.preventDefault()}>
         <DialogHeader className="sr-only">
          <DialogTitle>Busca Manual de Produto</DialogTitle>
          <DialogDescription>Selecione um produto da lista para adicioná-lo à venda.</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput
            placeholder="Digite para buscar um produto..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredStock.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item.name)}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                     <Package className="h-5 w-5 text-muted-foreground" />
                     <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {item.quantity}</p>
                     </div>
                  </div>
                  <span className="font-semibold">R$ {item.price.toFixed(2)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
