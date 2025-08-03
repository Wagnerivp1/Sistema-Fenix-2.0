
'use client';

import * as React from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Printer,
  X,
  FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import {
  getFinancialTransactions,
  saveFinancialTransactions,
  getSales,
  saveSales,
  getStock,
  saveStock,
  getCompanyInfo,
} from '@/lib/storage';
import type { FinancialTransaction, Sale, StockItem } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PrintReceiptDialog } from '@/components/financials/print-receipt-dialog';
import { SaleDetailsDialog } from '@/components/financials/sale-details-dialog';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}

const formatDateForDisplay = (dateString: string | undefined) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'Data inválida';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [allTransactions, setAllTransactions] = React.useState<FinancialTransaction[]>([]);
  const [allSales, setAllSales] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [descriptionFilter, setDescriptionFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [transactionToPrint, setTransactionToPrint] = React.useState<FinancialTransaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [saleForDetails, setSaleForDetails] = React.useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [loadedTransactions, loadedSales] = await Promise.all([
        getFinancialTransactions(),
        getSales()
    ]);
    loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(loadedTransactions);
    setAllSales(loadedSales);
    setIsLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTransaction = async (transactionId: string) => {
    const updatedTransactions = allTransactions.filter(t => t.id !== transactionId);
    setAllTransactions(updatedTransactions);
    await saveFinancialTransactions(updatedTransactions);
    toast({
      title: 'Lançamento Excluído!',
      description: 'A transação foi removida do seu histórico financeiro.',
    });
  };

  const handleReverseSale = async (transaction: FinancialTransaction) => {
    if (!transaction.relatedSaleId) return;

    const saleToReverse = allSales.find(s => s.id === transaction.relatedSaleId);
    if (saleToReverse) {
      const stock = await getStock();
      const updatedStock = [...stock];
      saleToReverse.items.forEach(saleItem => {
        const stockIndex = updatedStock.findIndex(stockItem => stockItem.id === saleItem.id);
        if (stockIndex !== -1) {
          updatedStock[stockIndex].quantity += saleItem.quantity;
        }
      });
      await saveStock(updatedStock);

      const updatedSales = allSales.filter(s => s.id !== transaction.relatedSaleId);
      setAllSales(updatedSales);
      await saveSales(updatedSales);
    }

    await handleDeleteTransaction(transaction.id);

    toast({
      title: 'Venda Estornada!',
      description: 'A venda foi estornada e os itens retornaram ao estoque.',
    });
  };

  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter(t => {
      const transactionDate = t.date ? parseISO(`${t.date}T00:00:00Z`) : null;
      const matchesDescription = t.description.toLowerCase().includes(descriptionFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesDate = !dateRange || 
                          !dateRange.from || 
                          (transactionDate && transactionDate >= dateRange.from && (!dateRange.to || transactionDate <= dateRange.to));

      return matchesDescription && matchesType && matchesDate && matchesCategory;
    });
  }, [allTransactions, descriptionFilter, typeFilter, categoryFilter, dateRange]);


  const totalReceitas = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;
  
  const calculateBalance = () => {
    return allTransactions.reduce((acc, t) => {
        return t.type === 'receita' ? acc + t.amount : acc - t.amount;
    }, 0);
  };
  
  const handlePrintClick = (transaction: FinancialTransaction) => {
    setTransactionToPrint(transaction);
    setIsPrintDialogOpen(true);
  };

  const handleDetailsClick = (transaction: FinancialTransaction) => {
    if (!transaction.relatedSaleId) return;
    const sale = allSales.find(s => s.id === transaction.relatedSaleId);
    if (sale) {
        setSaleForDetails(sale);
        setIsDetailsOpen(true);
    } else {
        toast({ variant: "destructive", title: "Erro", description: "Detalhes da venda não encontrados." });
    }
  }


  const generatePdf = async () => {
    const companyInfo = await getCompanyInfo();

    const generateContent = (logoImage: HTMLImageElement | null = null) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const fontColor = '#000000';

      // Cabeçalho
      if (logoImage) {
        doc.addImage(logoImage, 'PNG', margin, 12, 25, 25);
      }
      
      const titleX = logoImage ? margin + 30 : pageWidth / 2;
      const titleAlign = logoImage ? 'left' : 'center';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(companyInfo.name || "Relatório Financeiro", titleX, 20, { align: titleAlign });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const period = dateRange?.from ? 
                    `Período: ${format(dateRange.from, 'dd/MM/yyyy')} a ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'hoje'}` :
                    'Período: Todas as Transações';
      doc.text(period, titleX, 26, { align: titleAlign });

      // Resumo
      let currentY = 40;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("Resumo do Período", margin, currentY);
      currentY += 8;

      doc.autoTable({
          startY: currentY,
          body: [
              ['Total de Receitas', `R$ ${totalReceitas.toFixed(2)}`],
              ['Total de Despesas', `R$ ${totalDespesas.toFixed(2)}`],
              ['Saldo do Período', `R$ ${saldoPeriodo.toFixed(2)}`],
          ],
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249] },
          styles: { fontStyle: 'bold' }
      });
      currentY = doc.lastAutoTable.finalY + 10;
      
      // Tabela de Transações
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("Transações Detalhadas", margin, currentY);
      currentY += 8;

      doc.autoTable({
          startY: currentY,
          head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)']],
          body: filteredTransactions.map(t => [
              formatDateForDisplay(t.date),
              t.description,
              t.category,
              t.type === 'receita' ? 'Receita' : 'Despesa',
              { content: t.amount.toFixed(2), styles: { halign: 'right', textColor: t.type === 'receita' ? '#16a34a' : '#dc2626' } }
          ]),
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
      });

      doc.autoPrint();
      doc.output('dataurlnewwindow');
    };

    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.onload = () => generateContent(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        generateContent();
      };
    } else {
      generateContent();
    }
  }

  if (isLoading) {
    return <div>Carregando transações...</div>;
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Controle Financeiro</CardTitle>
            <CardDescription>
              Acompanhe suas receitas e despesas. Filtre por período para gerar relatórios.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Saldo Geral</p>
            <p
              className={cn(
                'text-2xl font-bold',
                calculateBalance() >= 0 ? 'text-green-500' : 'text-destructive'
              )}
            >
              R$ {calculateBalance().toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                    placeholder="Filtrar por descrição..."
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="receita">Receitas</SelectItem>
                        <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="Venda de Produto">Receita por Venda</SelectItem>
                    <SelectItem value="Venda de Serviço">Receita por OS</SelectItem>
                    <SelectItem value="Outra Receita">Outras Receitas</SelectItem>
                    <SelectItem value="Compra de Peça">Compra de Peça</SelectItem>
                    <SelectItem value="Salário">Salário</SelectItem>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Outra Despesa">Outras Despesas</SelectItem>
                  </SelectContent>
                </Select>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                        'text-left font-normal',
                        !dateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                            {format(dateRange.to, 'dd/MM/yyyy')}
                          </>
                        ) : (
                          format(dateRange.from, 'dd/MM/yyyy')
                        )
                      ) : (
                        <span>Selecione um período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                     {dateRange && (
                         <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                            <X className="mr-2 h-4 w-4" />
                            Limpar Filtro de Data
                        </Button>
                     )}
                     <Button variant="outline" size="sm" onClick={generatePdf} disabled={filteredTransactions.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Relatório
                     </Button>
                </div>
                <div className="flex gap-4 text-sm font-medium text-right">
                    <div className="text-green-500">
                        <span>Receitas no Período:</span> R$ {totalReceitas.toFixed(2)}
                    </div>
                    <div className="text-red-500">
                        <span>Despesas no Período:</span> R$ {totalDespesas.toFixed(2)}
                    </div>
                     <div className={cn(saldoPeriodo >= 0 ? "text-primary" : "text-destructive")}>
                        <span>Saldo do Período:</span> R$ {saldoPeriodo.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[64px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {transaction.type === 'receita' ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDateForDisplay(transaction.date)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-semibold',
                    transaction.type === 'receita' ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {transaction.type === 'receita' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      {transaction.relatedSaleId && (
                         <DropdownMenuItem onSelect={() => handleDetailsClick(transaction)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes da Venda
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => handlePrintClick(transaction)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Recibo
                      </DropdownMenuItem>
                      {transaction.relatedSaleId && (
                        <>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                              Estornar Venda
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Estorno</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A venda será cancelada, o lançamento
                                financeiro removido e os produtos retornarão ao estoque. Deseja continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleReverseSale(transaction)}>
                                Confirmar Estorno
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className={!transaction.relatedSaleId ? 'text-destructive' : ''}
                          >
                            Excluir Lançamento
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Atenção: esta ação removerá apenas o registro financeiro. A venda e o
                              estoque não serão alterados. Para reverter tudo, use "Estornar Venda".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)}>
                              Excluir Mesmo Assim
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma transação encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
     <PrintReceiptDialog
      isOpen={isPrintDialogOpen}
      onOpenChange={setIsPrintDialogOpen}
      transaction={transactionToPrint}
    />
     <SaleDetailsDialog
      isOpen={isDetailsOpen}
      onOpenChange={setIsDetailsOpen}
      sale={saleForDetails}
     />
    </>
  );
}
