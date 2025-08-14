
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
  WalletCards,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
  getServiceOrders,
  saveServiceOrders,
} from '@/lib/storage';
import type { FinancialTransaction, Sale, StockItem, ServiceOrder, OSPayment } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PrintReceiptDialog } from '@/components/financials/print-receipt-dialog';
import { SaleDetailsDialog } from '@/components/financials/sale-details-dialog';
import Link from 'next/link';

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
  const [allServiceOrders, setAllServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [descriptionFilter, setDescriptionFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return { from: start, to: end };
  });
  const [transactionToPrint, setTransactionToPrint] = React.useState<FinancialTransaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [saleForDetails, setSaleForDetails] = React.useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    const [loadedTransactions, loadedSales, loadedOrders] = await Promise.all([
        getFinancialTransactions(),
        getSales(),
        getServiceOrders(),
    ]);
    loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setAllTransactions(loadedTransactions);
    setAllSales(loadedSales);
    setAllServiceOrders(loadedOrders);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleMarkAsPaid = async (txId: string) => {
    const transactionToPay = allTransactions.find(tx => tx.id === txId);
    if (!transactionToPay) return;

    // Update financial transaction
    const updatedTransactions = allTransactions.map(tx => 
        tx.id === txId ? { ...tx, status: 'pago' as const, date: new Date().toISOString().split('T')[0] } : tx
    );
    setAllTransactions(updatedTransactions);
    await saveFinancialTransactions(updatedTransactions);

    // If it's related to an OS, update the OS
    if (transactionToPay.relatedServiceOrderId) {
        const osId = transactionToPay.relatedServiceOrderId;
        const currentOrders = await getServiceOrders();
        let osUpdated = false;

        const updatedOrders = currentOrders.map(order => {
            if (order.id === osId) {
                const newPayment: OSPayment = {
                    id: `PAY-${Date.now()}`,
                    amount: transactionToPay.amount,
                    date: new Date().toISOString().split('T')[0],
                    method: transactionToPay.paymentMethod,
                };
                
                const existingPayments = order.payments || [];
                const updatedPayments = [...existingPayments, newPayment];
                const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
                const totalValue = order.finalValue ?? order.totalValue ?? 0;
                
                const updatedOrder = {
                    ...order,
                    payments: updatedPayments,
                    status: totalPaid >= totalValue ? 'Finalizado' : order.status,
                };
                osUpdated = true;
                return updatedOrder;
            }
            return order;
        });

        if (osUpdated) {
            setAllServiceOrders(updatedOrders);
            await saveServiceOrders(updatedOrders);
        }
    }

    toast({ title: 'Sucesso!', description: 'Transação marcada como paga.'});
    // The component will re-render due to state change, refreshing the lists.
  };

  const combinedReceivables = React.useMemo(() => {
      const pendingTransactions = allTransactions.filter(t => t.status === 'pendente' && t.type === 'receita');
      
      const osReceivables = allServiceOrders.flatMap(o => {
          const totalPaid = o.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
          const balanceDue = (o.finalValue ?? o.totalValue ?? 0) - totalPaid;
          if (o.status === 'Aguardando Pagamento' && balanceDue > 0) {
              return [{
                  id: `OS-PENDING-${o.id}`,
                  type: 'receita' as const,
                  description: `Saldo pendente OS #${o.id.slice(-4)} - ${o.customerName}`,
                  amount: balanceDue,
                  date: o.date,
                  dueDate: o.deliveredDate,
                  status: 'pendente' as const,
                  category: 'Venda de Serviço' as const,
                  paymentMethod: o.paymentMethod || 'Pendente',
                  relatedServiceOrderId: o.id,
              }];
          }
          return [];
      });

      // Remove os-based receivables if there are already specific pending financial transactions for it
      const pendingOsIdsWithTransactions = new Set(pendingTransactions.map(t => t.relatedServiceOrderId));
      const filteredOsReceivables = osReceivables.filter(o => !pendingOsIdsWithTransactions.has(o.relatedServiceOrderId));

      return [...pendingTransactions, ...filteredOsReceivables].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allTransactions, allServiceOrders]);


  const filteredTransactions = React.useMemo(() => {
    if (typeFilter === 'contas_a_receber') {
        return combinedReceivables.filter(t => t.description.toLowerCase().includes(descriptionFilter.toLowerCase()));
    }

    return allTransactions.filter(t => {
      const transactionDate = t.date ? parseISO(`${t.date}T00:00:00Z`) : null;
      const matchesDescription = t.description.toLowerCase().includes(descriptionFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesDate = !dateRange || !dateRange.from || (transactionDate && transactionDate >= dateRange.from && (!dateRange.to || transactionDate <= dateRange.to));

      return matchesDescription && matchesType && matchesDate && matchesCategory;
    });
  }, [allTransactions, descriptionFilter, typeFilter, categoryFilter, dateRange, combinedReceivables]);


  const totalReceitas = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;
  
  const calculateCurrentMonthBalance = () => {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    return allTransactions
        .filter(t => {
            if (!t.date || isNaN(new Date(t.date).getTime())) return false;
            const transactionDate = parseISO(t.date);
            return isWithinInterval(transactionDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
        })
        .reduce((acc, t) => {
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
      let currentY = 40;
      let textX = margin;
      const logoWidth = 25;
      const logoHeight = 25;
      const logoSpacing = 5;

      // Header
      if (logoImage) {
        doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, 12, logoWidth, logoHeight);
        textX = margin + logoWidth + logoSpacing;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(companyInfo.name || "Relatório Financeiro", textX, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const period = dateRange?.from ? 
                    `Período: ${format(dateRange.from, 'dd/MM/yyyy')} a ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'hoje'}` :
                    'Período: Todas as Transações';
      doc.text(period, textX, 26);

      // Summary
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
      
      // Transactions Table
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
        generateContent(null);
      };
    } else {
      generateContent();
    }
  }
  
  const renderReceivablesHeader = () => {
    if (typeFilter !== 'contas_a_receber') return null;

    if (combinedReceivables.length > 0) {
      const totalReceivable = combinedReceivables.reduce((sum, item) => sum + item.amount, 0);
      return (
        <div className="mb-4 p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-lg text-destructive">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-bold">Contas a Receber</h3>
              <p className="text-sm font-semibold">
                Total pendente: R$ {totalReceivable.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 border-l-4 border-green-500 bg-green-500/10 rounded-r-lg text-green-700">
         <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-bold">Nenhum Pagamento Pendente</h3>
              <p className="text-sm">Todas as contas a receber estão em dia.</p>
            </div>
          </div>
      </div>
    );
  };

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
            <p className="text-sm text-muted-foreground">Saldo do Mês</p>
            <p
              className={cn(
                'text-2xl font-bold',
                calculateCurrentMonthBalance() >= 0 ? 'text-green-500' : 'text-destructive'
              )}
            >
              R$ {calculateCurrentMonthBalance().toFixed(2)}
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
                        <SelectItem value="all">Todos os Lançamentos</SelectItem>
                        <SelectItem value="receita">Receitas</SelectItem>
                        <SelectItem value="despesa">Despesas</SelectItem>
                        <SelectItem value="contas_a_receber">Contas a Receber</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={typeFilter === 'contas_a_receber'}>
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
                      className={cn( 'text-left font-normal', !dateRange && 'text-muted-foreground' )}
                      disabled={typeFilter === 'contas_a_receber'}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? ( dateRange.to ? (
                          <> {format(dateRange.from, 'dd/MM/yyyy')} -{' '} {format(dateRange.to, 'dd/MM/yyyy')} </>
                        ) : ( format(dateRange.from, 'dd/MM/yyyy') )
                      ) : ( <span>Selecione um período</span> )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={1} locale={ptBR}/>
                  </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                     {dateRange && typeFilter !== 'contas_a_receber' && (
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

        {renderReceivablesHeader()}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="hidden md:table-cell">{typeFilter === 'contas_a_receber' ? 'Vencimento' : 'Data'}</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[64px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const isPending = transaction.status === 'pendente';
              const valueColorClass = transaction.type === 'receita' && !isPending ? 'text-green-500' : isPending ? 'text-destructive' : 'text-red-500';
              
              return (
                <TableRow key={transaction.id} className={cn(isPending && 'bg-destructive/10')}>
                  <TableCell>
                    {transaction.type === 'receita' ? (<ArrowUpCircle className="h-5 w-5 text-green-500" />) : (<ArrowDownCircle className="h-5 w-5 text-red-500" />)}
                  </TableCell>
                  <TableCell className={cn('font-medium', isPending && 'text-destructive')}>
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDateForDisplay(transaction.dueDate || transaction.date)}
                  </TableCell>
                  <TableCell className={cn('text-right font-semibold', valueColorClass)}>
                    {transaction.type === 'receita' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                         {transaction.status === 'pendente' && (
                           <DropdownMenuItem onSelect={() => handleMarkAsPaid(transaction.id)}><CheckCircle className="mr-2 h-4 w-4"/>Marcar como Pago</DropdownMenuItem>
                         )}
                         {transaction.relatedSaleId && (
                           <DropdownMenuItem onSelect={() => handleDetailsClick(transaction)}><FileText className="mr-2 h-4 w-4" />Ver Detalhes da Venda</DropdownMenuItem>
                         )}
                         {transaction.relatedServiceOrderId && (
                           <DropdownMenuItem asChild><Link href={`/ordens-de-servico?orderId=${transaction.relatedServiceOrderId}`}><FileText className="mr-2 h-4 w-4"/>Ver Ordem de Serviço</Link></DropdownMenuItem>
                         )}
                        <DropdownMenuItem onSelect={() => handlePrintClick(transaction)}><Printer className="mr-2 h-4 w-4" />Imprimir Recibo</DropdownMenuItem>
                        {transaction.relatedSaleId && (<>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Estornar Venda</DropdownMenuItem></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Confirmar Estorno</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. A venda será cancelada, o lançamento financeiro removido e os produtos retornarão ao estoque. Deseja continuar?</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleReverseSale(transaction)}>Confirmar Estorno</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog></>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className={!transaction.relatedSaleId ? 'text-destructive' : ''}>Excluir Lançamento</DropdownMenuItem></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle><AlertDialogDescription>Atenção: esta ação removerá apenas o registro financeiro. A venda e o estoque não serão alterados. Para reverter tudo, use "Estornar Venda".</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)}>Excluir Mesmo Assim</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
             {filteredTransactions.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada para os filtros selecionados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
     <PrintReceiptDialog isOpen={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} transaction={transactionToPrint}/>
     <SaleDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={saleForDetails}/>
    </>
  );
}
