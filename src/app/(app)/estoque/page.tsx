
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Search, MoreHorizontal, FileDown, Printer, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getStock, saveStock } from '@/lib/storage';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { EditStockItemDialog } from '@/components/stock/edit-stock-item-dialog';
import { AddStockEntryDialog } from '@/components/stock/add-stock-entry-dialog';
import { PrintLabelDialog } from '@/components/stock/print-label-dialog';
import { Badge } from '@/components/ui/badge';

export default function StockPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filter, setFilter] = React.useState(searchParams.get('filter') || 'all');
  
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = React.useState(false);
  const [isPrintLabelOpen, setIsPrintLabelOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<StockItem | null>(null);

  const loadStock = async () => {
    setIsLoading(true);
    const stockData = await getStock();
    setStock(stockData);
    setIsLoading(false);
  };
  
  React.useEffect(() => {
    loadStock();
  }, []);

  const filteredStock = React.useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (filter === 'low_stock') {
        return matchesSearch && item.minStock && item.quantity <= item.minStock;
      }
      
      return matchesSearch;
    });
  }, [stock, searchTerm, filter]);

  const handleSaveItem = async (itemToSave: StockItem) => {
    const isNew = !stock.some(i => i.id === itemToSave.id);
    let updatedStock;

    if (isNew) {
      updatedStock = [itemToSave, ...stock];
      toast({ title: "Produto Adicionado!", description: `${itemToSave.name} foi adicionado ao estoque.` });
    } else {
      updatedStock = stock.map(i => i.id === itemToSave.id ? itemToSave : i);
      toast({ title: "Produto Atualizado!", description: `Os dados de ${itemToSave.name} foram salvos.` });
    }
    
    setStock(updatedStock);
    await saveStock(updatedStock);
    setIsEditOpen(false);
  };
  
  const handleAddStockEntry = async (item: StockItem, quantity: number) => {
    const updatedStock = stock.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
    );
    setStock(updatedStock);
    await saveStock(updatedStock);
    toast({ title: "Entrada Registrada!", description: `${quantity} unidade(s) de ${item.name} foram adicionadas.` });
    setIsAddEntryOpen(false);
  };
  
  const handleOpenDialog = (dialog: 'edit' | 'addEntry' | 'printLabel', item: StockItem | null) => {
    setSelectedItem(item);
    if (dialog === 'edit') setIsEditOpen(true);
    if (dialog === 'addEntry' && item) setIsAddEntryOpen(true);
    if (dialog === 'printLabel' && item) setIsPrintLabelOpen(true);
  };

  if (isLoading) {
    return <div>Carregando estoque...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Controle de Estoque</CardTitle>
              <CardDescription>
                Gerencie os produtos, peças e suprimentos da sua assistência técnica.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="hidden sm:flex">
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
                <Button size="sm" onClick={() => handleOpenDialog('edit', null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Produto
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome ou código..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {filter === 'low_stock' ? 'Estoque Baixo' : 'Filtro'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setFilter('all')}>Todos</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setFilter('low_stock')}>Estoque Baixo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd.</TableHead>
                  <TableHead className="text-right">Preço de Venda</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.length > 0 ? (
                  filteredStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.minStock && item.quantity <= item.minStock ? 'destructive' : 'secondary'}>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenDialog('edit', item)}>Editar Produto</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenDialog('addEntry', item)}>Adicionar Entrada</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenDialog('printLabel', item)}>
                               <Printer className="mr-2 h-4 w-4" /> Imprimir Etiqueta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{filteredStock.length}</strong> de <strong>{stock.length}</strong> produtos.
            </div>
        </CardFooter>
      </Card>
      
      <EditStockItemDialog 
        item={selectedItem}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveItem}
      />

      <AddStockEntryDialog
        item={selectedItem}
        isOpen={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        onSave={handleAddStockEntry}
      />
      
      <PrintLabelDialog
        item={selectedItem}
        isOpen={isPrintLabelOpen}
        onOpenChange={setIsPrintLabelOpen}
      />
    </>
  );
}
