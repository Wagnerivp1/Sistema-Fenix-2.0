
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
import { getStock, saveStock, getCompanyInfo } from '@/lib/storage';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EditStockItemDialog } from '@/components/stock/edit-stock-item-dialog';
import { AddStockEntryDialog } from '@/components/stock/add-stock-entry-dialog';
import { PrintLabelDialog } from '@/components/stock/print-label-dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}


function EstoquePageComponent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [editingItem, setEditingItem] = React.useState<StockItem | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [itemForEntry, setItemForEntry] = React.useState<StockItem | null>(null);
  const [isEntryOpen, setIsEntryOpen] = React.useState(false);
  const [itemToPrint, setItemToPrint] = React.useState<StockItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const loadStock = async () => {
      setIsLoading(true);
      const data = await getStock();
      setStockItems(data);
      if (filterParam === 'low_stock') {
        setStatusFilter('low_stock');
      }
      setIsLoading(false);
    }
    loadStock();
  }, [filterParam]);

  const filteredItems = React.useMemo(() => {
    return stockItems.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

        if (statusFilter === 'all') {
            return matchesSearch;
        }

        const isLowStock = item.minStock !== undefined && item.quantity <= item.minStock;
        const isOutOfStock = item.quantity <= 0;

        const matchesStatus = statusFilter === 'low_stock' ? isLowStock && !isOutOfStock :
                              statusFilter === 'out_of_stock' ? isOutOfStock :
                              true;

        return matchesSearch && matchesStatus;
    });
  }, [stockItems, searchTerm, statusFilter]);

  
  const handleSaveItem = async (itemToSave: StockItem) => {
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
    await saveStock(updatedItems);
    setIsEditOpen(false);
    setEditingItem(null);
  };
  
  const handleAddEntry = async (item: StockItem, quantity: number) => {
    const updatedItems = stockItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
    setStockItems(updatedItems);
    await saveStock(updatedItems);
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

  const generatePdf = async (reportType: 'low' | 'full') => {
    const companyInfo = await getCompanyInfo();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let textX = margin;
    const logoWidth = 20;
    const logoHeight = 20;
    const logoSpacing = 5;

    const reportTitle = reportType === 'low' ? 'Relatório de Estoque Baixo' : 'Relatório de Estoque Completo';
    const itemsToPrint = reportType === 'low'
      ? stockItems.filter(item => item.minStock && item.quantity <= item.minStock)
      : stockItems;

    if (itemsToPrint.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum item encontrado',
        description: `Não há itens para gerar o ${reportTitle.toLowerCase()}.`
      });
      return;
    }

    const performGeneration = (logoImage: HTMLImageElement | null) => {
        let currentY = 20;
        if (logoImage) {
            const logoAR = logoImage.width / logoImage.height;
            doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY - 8, logoWidth * logoAR, logoHeight);
            textX = margin + (logoWidth * logoAR) + logoSpacing;
        }

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(companyInfo.name || "Relatório de Estoque", textX, currentY);
        currentY += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(reportTitle, textX, currentY);
        currentY += 6;
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, textX, currentY);
        currentY += 10;


        // Table
        doc.autoTable({
          startY: currentY,
          head: [['Cód.', 'Produto', 'Categoria', 'Qtd.', 'Mín.', 'Preço Venda']],
          body: itemsToPrint.map(item => [
            item.barcode.slice(-6),
            item.name,
            item.category || '-',
            item.quantity,
            item.minStock || 0,
            `R$ ${item.price.toFixed(2)}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
        });
        
        doc.autoPrint();
        doc.output('dataurlnewwindow');
    };

    if (companyInfo.logoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = companyInfo.logoUrl;
      img.onload = () => performGeneration(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        performGeneration(null);
      };
    } else {
      performGeneration(null);
    }
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Printer className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Relatórios</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Imprimir Relatórios</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => generatePdf('low')}>
                  Relatório de Estoque Baixo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generatePdf('full')}>
                  Relatório de Estoque Completo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar por nome ou categoria..."
              className="w-full rounded-lg bg-background pl-8 md:w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="low_stock">Estoque Baixo</SelectItem>
              <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px] hidden sm:table-cell"></TableHead>
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
                <TableCell className="hidden sm:table-cell">
                   <div className="bg-muted rounded-md w-12 h-12 flex items-center justify-center">
                    <FileDown className="h-6 w-6 text-muted-foreground" />
                  </div>
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

export default function EstoquePage() {
    return (
        <React.Suspense fallback={<div>Carregando...</div>}>
            <EstoquePageComponent />
        </React.Suspense>
    )
}
