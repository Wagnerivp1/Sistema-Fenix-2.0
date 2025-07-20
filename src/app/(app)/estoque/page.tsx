
'use client';

import * as React from 'react';
import { PlusCircle, Search, MoreHorizontal, ArrowUpDown, Inbox, FileDown, Printer } from 'lucide-react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { getStock, saveStock } from '@/lib/storage';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EditStockItemDialog } from '@/components/stock/edit-stock-item-dialog';
import { AddStockEntryDialog } from '@/components/stock/add-stock-entry-dialog';
import { PrintLabelDialog } from '@/components/stock/print-label-dialog';

export default function EstoquePage() {
  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<StockItem | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [itemForEntry, setItemForEntry] = React.useState<StockItem | null>(null);
  const [isEntryOpen, setIsEntryOpen] = React.useState(false);
  const [itemToPrint, setItemToPrint] = React.useState<StockItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setStockItems(getStock());
    setIsLoading(false);
  }, []);

  const filteredItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSaveItem = (itemToSave: StockItem) => {
    const exists = stockItems.some(item => item.id === itemToSave.id);
    let updatedItems;
    if (exists) {
        updatedItems = stockItems.map(item => item.id === itemToSave.id ? itemToSave : item);
        toast({ title: 'Produto Atualizado!', description: `O item "${itemToSave.name}" foi salvo.` });
    } else {
        updatedItems = [itemToSave, ...stockItems];
        toast({ title: 'Produto Adicionado!', description: `O item "${itemToSave.name}" foi cadastrado.` });
    }
    setStockItems(updatedItems);
    saveStock(updatedItems);
    setIsEditOpen(false);
    setEditingItem(null);
  };
  
  const handleAddEntry = (item: StockItem, quantity: number) => {
    const updatedItems = stockItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
    setStockItems(updatedItems);
    saveStock(updatedItems);
    toast({ title: 'Entrada Registrada!', description: `${quantity} unidade(s) de "${item.name}" adicionada(s) ao estoque.` });
    setIsEntryOpen(false);
    setItemForEntry(null);
  };
  
  const handleOpenDialog = (type: 'edit' | 'entry' | 'print', item: StockItem | null) => {
    if (type === 'edit') {
        setEditingItem(item);
        setIsEditOpen(true);
    } else if (type === 'entry') {
        setItemForEntry(item);
        setIsEntryOpen(true);
    } else if (type === 'print') {
        setItemToPrint(item);
        setIsPrintOpen(true);
    }
  }

  const getStockBadge = (item: StockItem) => {
    if (item.quantity <= 0) {
      return (
        <Badge variant="destructive" className="text-destructive-foreground">
          Sem estoque
        </Badge>
      );
    }
    if (item.minStock && item.quantity <= item.minStock) {
      return (
        <Badge className="bg-yellow-500/80 text-white hover:bg-yellow-500/90">
          Estoque Baixo
        </Badge>
      );
    }
    return <Badge variant="secondary">Em estoque</Badge>;
  };
  
  if (isLoading) {
    return <div>Carregando estoque...</div>;
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Controle de Estoque</CardTitle>
            <CardDescription>
              Gerencie seus produtos, peças e insumos.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <FileDown className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog('edit', null)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Produto
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar por nome ou categoria..."
              className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]"></TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Preço (R$)</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{getStockBadge(item)}</TableCell>
                <TableCell className="hidden md:table-cell">{item.category || 'N/A'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.price.toFixed(2)}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleOpenDialog('edit', item)}>Editar Produto</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDialog('entry', item)}>Adicionar Entrada</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleOpenDialog('print', item)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Etiquetas
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Excluir Produto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
            ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
    
    <EditStockItemDialog 
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveItem}
        item={editingItem}
    />
    
    <AddStockEntryDialog
        isOpen={isEntryOpen}
        onOpenChange={setIsEntryOpen}
        onSave={handleAddEntry}
        item={itemForEntry}
    />

    <PrintLabelDialog
        isOpen={isPrintOpen}
        onOpenChange={setIsPrintOpen}
        item={itemToPrint}
    />

    </>
  );
}
