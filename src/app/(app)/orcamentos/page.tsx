
'use client';

import * as React from 'react';
import { MoreHorizontal, FileText, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getQuotes, saveQuotes, getSales, saveSales, getFinancialTransactions, saveFinancialTransactions } from '@/lib/storage';
import type { Quote, Sale, FinancialTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SaleDetailsDialog } from '@/components/financials/sale-details-dialog'; // Reusing this for viewing items

const formatDate = (dateString: string) => {
    if (!dateString) return 'Data inválida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const getStatusVariant = (status: Quote['status']) => {
    switch (status) {
        case 'Pendente': return 'bg-yellow-500/20 text-yellow-400';
        case 'Aprovado': return 'bg-green-500/20 text-green-400';
        case 'Cancelado': return 'bg-red-500/20 text-red-400';
        case 'Vendido': return 'bg-purple-500/20 text-purple-400';
        default: return 'bg-gray-700/50 text-gray-300';
    }
};

export default function OrcamentosPage() {
    const { toast } = useToast();
    const [quotes, setQuotes] = React.useState<Quote[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState('Pendente');
    const [searchFilter, setSearchFilter] = React.useState('');
    const [selectedQuoteForDetails, setSelectedQuoteForDetails] = React.useState<Quote | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    
    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const loadedQuotes = await getQuotes();
        setQuotes(loadedQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsLoading(false);
    };

    const handleQuickStatusChange = async (quoteId: string, status: Quote['status']) => {
        const updatedQuotes = quotes.map(q => q.id === quoteId ? { ...q, status } : q);
        setQuotes(updatedQuotes);
        await saveQuotes(updatedQuotes);
        toast({ title: 'Status Alterado!', description: `O orçamento #${quoteId.slice(-6)} foi atualizado.` });
    };

    const handleConvertToSale = async (quote: Quote) => {
        const newSale: Sale = {
            id: `SALE-${Date.now()}`,
            relatedQuoteId: quote.id,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR'),
            user: quote.user,
            items: quote.items,
            subtotal: quote.subtotal,
            discount: quote.discount,
            total: quote.total,
            paymentMethod: 'A definir', // User should update this later
            observations: `Venda gerada a partir do orçamento #${quote.id.slice(-6)}. ${quote.observations || ''}`.trim(),
            customerId: quote.customerId,
        };

        const newTransaction: FinancialTransaction = {
            id: `FIN-${Date.now()}`,
            type: 'receita',
            description: `Venda do Orçamento #${quote.id.slice(-6)}`,
            amount: newSale.total,
            date: newSale.date,
            category: 'Venda de Produto',
            paymentMethod: 'A definir',
            relatedSaleId: newSale.id,
        };

        const [existingSales, existingTransactions] = await Promise.all([
            getSales(),
            getFinancialTransactions(),
        ]);
        
        await saveSales([newSale, ...existingSales]);
        await saveFinancialTransactions([newTransaction, ...existingTransactions]);

        handleQuickStatusChange(quote.id, 'Vendido');
        
        toast({
            title: 'Orçamento Convertido em Venda!',
            description: `A Venda #${newSale.id.slice(-6)} foi criada e um lançamento financeiro foi gerado.`,
        });
    };
    
    const handleDeleteQuote = async (quoteId: string) => {
        const updatedQuotes = quotes.filter(q => q.id !== quoteId);
        setQuotes(updatedQuotes);
        await saveQuotes(updatedQuotes);
        toast({
            variant: 'destructive',
            title: 'Orçamento Excluído!',
            description: 'O orçamento foi removido permanentemente.',
        });
    };

    const filteredQuotes = React.useMemo(() => {
        let result = [...quotes];
        if (statusFilter !== 'todos') {
            result = result.filter(q => q.status === statusFilter);
        }
        if (searchFilter) {
            const lowerCaseFilter = searchFilter.toLowerCase();
            result = result.filter(q =>
                (q.customerName && q.customerName.toLowerCase().includes(lowerCaseFilter)) ||
                (q.id && q.id.toLowerCase().includes(lowerCaseFilter))
            );
        }
        return result;
    }, [quotes, statusFilter, searchFilter]);

    if (isLoading) {
        return <div>Carregando orçamentos...</div>;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle>Gerenciamento de Orçamentos</CardTitle>
                            <CardDescription>Acompanhe, edite e converta seus orçamentos em vendas.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por Status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendente">Pendentes</SelectItem>
                                    <SelectItem value="Aprovado">Aprovados</SelectItem>
                                    <SelectItem value="Cancelado">Cancelados</SelectItem>
                                    <SelectItem value="Vendido">Vendidos</SelectItem>
                                    <SelectItem value="todos">Todos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input
                            placeholder="Filtrar por cliente ou nº do orçamento..."
                            className="max-w-sm"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuotes.map(quote => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">#{quote.id.slice(-6)}</TableCell>
                                    <TableCell>{quote.customerName || 'Não informado'}</TableCell>
                                    <TableCell>{formatDate(quote.date)}</TableCell>
                                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                                    <TableCell>R$ {quote.total.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('font-semibold', getStatusVariant(quote.status))}>
                                            {quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => {
                                                    setSelectedQuoteForDetails(quote);
                                                    setIsDetailsOpen(true);
                                                }}><FileText className="mr-2"/>Ver Detalhes</DropdownMenuItem>
                                                 {quote.status === 'Aprovado' && (
                                                    <DropdownMenuItem onSelect={() => handleConvertToSale(quote)} className="text-green-500 focus:text-green-500">
                                                        <ShoppingCart className="mr-2"/>Converter em Venda
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Mudar Status</DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuRadioGroup value={quote.status} onValueChange={(v) => handleQuickStatusChange(quote.id, v as Quote['status'])}>
                                                                <DropdownMenuRadioItem value="Pendente">Pendente</DropdownMenuRadioItem>
                                                                <DropdownMenuRadioItem value="Aprovado">Aprovado</DropdownMenuRadioItem>
                                                                <DropdownMenuRadioItem value="Cancelado">Cancelado</DropdownMenuRadioItem>
                                                            </DropdownMenuRadioGroup>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">Excluir</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                            <AlertDialogDescription>Esta ação não pode ser desfeita e excluirá o orçamento permanentemente.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)}>Excluir</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {filteredQuotes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Nenhum orçamento encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedQuoteForDetails && (
                <SaleDetailsDialog
                    isOpen={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    sale={selectedQuoteForDetails as any} // Casting as Sale for prop compatibility
                />
            )}
        </>
    );
}
