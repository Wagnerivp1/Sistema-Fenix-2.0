
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock, Printer, ShoppingCart, Percent, DollarSign, StickyNote } from 'lucide-react';
import type { Sale } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface SaleDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale: Sale | null;
}

const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold">{value || 'Não informado'}</p>
        </div>
    </div>
);

export function SaleDetailsDialog({ isOpen, onOpenChange, sale }: SaleDetailsDialogProps) {
    const { toast } = useToast();

    const handlePrint = () => {
        // Lógica de impressão pode ser adicionada aqui no futuro
        toast({ title: "Função em desenvolvimento", description: "A impressão de detalhes da venda será implementada em breve." });
    }

    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalhes da Venda #{sale.id.slice(-6)}</DialogTitle>
                    <DialogDescription>
                        Informações completas sobre a transação realizada.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow min-h-0">
                    <ScrollArea className="h-full pr-6">
                        <div className="space-y-6">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold mb-4">Informações Gerais</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                                    <InfoItem icon={User} label="Vendido por" value={sale.user} />
                                    <InfoItem icon={Calendar} label="Data" value={formatDate(sale.date)} />
                                    <InfoItem icon={Clock} label="Hora" value={sale.time} />
                                    <InfoItem icon={DollarSign} label="Forma de Pagamento" value={sale.paymentMethod} />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Itens Vendidos</h3>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produto</TableHead>
                                                <TableHead className="text-center">Qtd.</TableHead>
                                                <TableHead className="text-right">Preço Unit.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sale.items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            
                             <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold mb-4">Resumo Financeiro</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Subtotal dos Itens</span>
                                        <span>R$ {sale.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Desconto Aplicado</span>
                                        <span className="text-destructive">- R$ {sale.discount.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center font-bold text-lg">
                                        <span>Total Final</span>
                                        <span>R$ {sale.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {sale.observations && (
                                 <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2"><StickyNote className="h-5 w-5" /> Observações</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sale.observations}</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Detalhes
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
