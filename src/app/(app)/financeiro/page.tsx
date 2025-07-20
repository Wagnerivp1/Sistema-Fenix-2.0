
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
import { getFinancialTransactions } from '@/lib/storage';
import type { FinancialTransaction } from '@/types';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadedTransactions = getFinancialTransactions();
    // Sort by date, most recent first
    loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(loadedTransactions);
    setIsLoading(false);
  }, []);

  const calculateBalance = () => {
    return transactions.reduce((acc, t) => {
        return t.type === 'receita' ? acc + t.amount : acc - t.amount;
    }, 0);
  };

  const totalReceitas = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
