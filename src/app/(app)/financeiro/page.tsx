
'use client';

import * as React from 'react';
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
import { getFinancialTransactions, saveFinancialTransactions, getSales, saveSales, getStock, saveStock } from '@/lib/storage';
import type { FinancialTransaction, Sale, StockItem } from '@/types';
import { ArrowDownCircle, ArrowUpCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');

  const loadData = () => {
    const loadedTransactions = getFinancialTransactions();
    loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(loadedTransactions);
  }

  React.useEffect(() => {
    loadData();
    setIsLoading(false);
  }, []);

  const handleDeleteTransaction = (transactionId: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(updatedTransactions);
    saveFinancialTransactions(updatedTransactions);
    toast({
      title: 'Lançamento Excluído!',
      description: 'A transação foi removida do seu histórico financeiro.',
    });
  };

  const handleReverseSale = (transaction: FinancialTransaction) => {
    if (!transaction.relatedSaleId) return;

    // 1. Restore stock
    const sales = getSales();
    const saleToReverse = sales.find(s => s.id === transaction.relatedSaleId);
    if (saleToReverse) {
        const stock = getStock();
        const updatedStock = [...stock];
        saleToReverse.items.forEach(saleItem => {
            const stockIndex = updatedStock.findIndex(stockItem => stockItem.id === saleItem.id);
            if (stockIndex !== -1) {
                updatedStock[stockIndex].quantity += saleItem.quantity;
            }
        });
        saveStock(updatedStock);

        // 2. Delete sale record
        const updatedSales = sales.filter(s => s.id !== transaction.relatedSaleId);
        saveSales(updatedSales);
    }

    // 3. Delete financial transaction
    handleDeleteTransaction(transaction.id);

    toast({
        title: 'Venda Estornada!',
        description: 'A venda foi estornada e os itens retornaram ao estoque.',
    });
  };

  const calculateBalance = () => {
    return transactions.reduce((acc, t) => {
        return t.type === 'receita' ? acc + t.amount : acc - t.amount;
    }, 0);
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(filter.toLowerCase())
  );

  const totalReceitas = filteredTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = filteredTransactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);

  if (isLoading) {
    return <div>Carregando transações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div>
                <CardTitle>Controle Financeiro</CardTitle>
                <CardDescription>
                  Acompanhe suas receitas e despesas.
                </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className={cn(
                    "text-2xl font-bold",
                    calculateBalance() >= 0 ? "text-green-500" : "text-destructive"
                )}>
                    R$ {calculateBalance().toFixed(2)}
                </p>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Filtrar por descrição..."
                    className="max-w-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="flex gap-4 text-sm">
                <div className="text-green-500">
                    <span className="font-semibold">Receitas:</span> R$ {totalReceitas.toFixed(2)}
                </div>
                <div className="text-red-500">
                    <span className="font-semibold">Despesas:</span> R$ {totalDespesas.toFixed(2)}
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
                    {transaction.type === 'receita' ? 
                        <ArrowUpCircle className="h-5 w-5 text-green-500" /> : 
                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    }
                </TableCell>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(transaction.date)}</TableCell>
                <TableCell className={cn(
                    "text-right font-semibold",
                    transaction.type === 'receita' ? "text-green-500" : "text-red-500"
                )}>
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
                                            Esta ação não pode ser desfeita. A venda será cancelada, o lançamento financeiro removido e os produtos retornarão ao estoque. Deseja continuar?
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
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={!transaction.relatedSaleId ? "text-destructive" : ""}>
                                    Excluir Lançamento
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Atenção: esta ação removerá apenas o registro financeiro. A venda e o estoque não serão alterados. Para reverter tudo, use "Estornar Venda".
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
