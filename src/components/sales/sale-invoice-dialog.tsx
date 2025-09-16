
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
import { User, Calendar, Clock, Printer, ShoppingCart, DollarSign, StickyNote, AlertTriangle } from 'lucide-react';
import type { Sale, CompanyInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getCompanyInfo } from '@/lib/storage';

interface SaleInvoiceDialogProps {
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


export function SaleInvoiceDialog({ isOpen, onOpenChange, sale }: SaleInvoiceDialogProps) {
    const { toast } = useToast();

    const handlePrint = async () => {
        if (!sale) {
            toast({ variant: "destructive", title: "Erro", description: "Não há dados da venda para imprimir." });
            return;
        }

        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const companyInfo = await getCompanyInfo();
        const logoDataUrl = companyInfo.logoUrl || null;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 20;
        let textX = margin;
        const logoWidth = 30;
        const logoHeight = 30;
        const logoSpacing = 5;
        
        // Cabeçalho
         if (logoDataUrl) {
           try {
            doc.addImage(logoDataUrl, logoDataUrl.includes('png') ? 'PNG' : 'JPEG', margin, currentY - 8, logoWidth, logoHeight);
            textX = margin + logoWidth + logoSpacing;
           } catch (e) {
              console.warn("Could not add logo to PDF:", e);
           }
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        if (companyInfo?.name) {
            doc.text(companyInfo.name, textX, currentY);
            currentY += 8;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyInfo?.address) {
            doc.text(companyInfo.address, textX, currentY);
            currentY += 4;
        }
        if (companyInfo?.phone || companyInfo?.emailOrSite) {
            doc.text(`Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`, textX, currentY);
        }

        const rightHeaderX = pageWidth - margin;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Comprovante de Venda`, rightHeaderX, currentY - 8, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Venda #${sale.id.slice(-6)}`, rightHeaderX, currentY - 2, { align: 'right' });
        doc.text(`Data: ${formatDate(sale.date)} ${sale.time}`, rightHeaderX, currentY + 4, { align: 'right' });
        
        currentY = 50;
        
        // Detalhes da Venda
        (doc as any).autoTable({
            startY: currentY,
            head: [['Vendedor', 'Forma de Pagamento']],
            body: [[sale.user, sale.paymentMethod]],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2, lineColor: [220,220,220] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 8;

        // Tabela de Itens
        (doc as any).autoTable({
            startY: currentY,
            head: [['Produto', 'Qtd.', 'Preço Unit.', 'Subtotal']],
            body: sale.items.map(item => [
                item.name,
                item.quantity,
                `R$ ${item.price.toFixed(2)}`,
                `R$ ${(item.price * item.quantity).toFixed(2)}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold' },
            footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' },
            foot: [
                [{ content: 'Subtotal:', colSpan: 3, styles: { halign: 'right' } }, `R$ ${sale.subtotal.toFixed(2)}`],
                [{ content: 'Desconto:', colSpan: 3, styles: { halign: 'right' } }, `- R$ ${sale.discount.toFixed(2)}`],
                [{ content: 'Total Final:', colSpan: 3, styles: { halign: 'right' } }, `R$ ${sale.total.toFixed(2)}`],
            ]
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
        
        // Observações
        if (sale.observations) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("Observações:", margin, currentY);
            currentY += 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const obsLines = doc.splitTextToSize(sale.observations, pageWidth - (margin * 2));
            doc.text(obsLines, margin, currentY);
        }
        
        doc.autoPrint();
        doc.output('dataurlnewwindow');
    }


    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{sale.status === 'Estornada' ? 'Venda Estornada' : 'Fatura da Venda'} #{sale.id.slice(-6)}</DialogTitle>
                    <DialogDescription>
                       {sale.status === 'Estornada'
                        ? "Esta venda foi estornada. Os detalhes são apenas para consulta."
                        : "A venda foi finalizada. Imprima a fatura para o cliente."
                       }
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow min-h-0">
                    <ScrollArea className="h-full pr-6">
                        <div className="space-y-6">
                            {sale.status === 'Estornada' && (
                                <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-lg">
                                    <div className="flex items-start gap-3 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        <div>
                                            <h4 className="font-semibold">Venda Estornada</h4>
                                            <p className="text-sm">
                                                Motivo: {sale.reversalReason || 'Não informado.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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

                <DialogFooter className="flex-shrink-0 pt-4 border-t sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                    <Button onClick={handlePrint} disabled={sale.status === 'Estornada'}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Fatura
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
