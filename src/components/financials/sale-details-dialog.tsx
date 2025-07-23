
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
import { User, Calendar, Clock, Printer, ShoppingCart, DollarSign, StickyNote } from 'lucide-react';
import type { Sale, CompanyInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getCompanyInfo } from '@/lib/storage';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}

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

    const handlePrint = async () => {
        if (!sale) {
            toast({ variant: "destructive", title: "Erro", description: "Não há dados da venda para imprimir." });
            return;
        }

        const companyInfo = await getCompanyInfo();

        const generateContent = (logoImage: HTMLImageElement | null = null) => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let currentY = 15;
            const fontColor = '#000000';
            
            // Cabeçalho
            if (logoImage) {
                const logoAR = logoImage.width / logoImage.height;
                doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', pageWidth / 2 - (25 * logoAR / 2), currentY, 25 * logoAR, 25);
                currentY += 30;
            }
            if (companyInfo?.name) {
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text(companyInfo.name, pageWidth / 2, currentY, { align: 'center'});
                currentY += 7;
            }
            if (companyInfo?.address) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(companyInfo.address, pageWidth / 2, currentY, { align: 'center'});
                currentY += 4;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Comprovante de Venda`, pageWidth / 2, currentY, { align: 'center'});
            currentY += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Venda #${sale.id.slice(-6)} | Data: ${formatDate(sale.date)} ${sale.time}`, pageWidth / 2, currentY, { align: 'center'});
            
            currentY += 10;
            
            // Detalhes da Venda
            doc.setFontSize(9);
            doc.text(`Vendedor: ${sale.user}`, margin, currentY);
            doc.text(`Forma de Pagamento: ${sale.paymentMethod}`, pageWidth - margin, currentY, { align: 'right' });
            currentY += 8;

            // Tabela de Itens
            doc.autoTable({
                startY: currentY,
                head: [['Produto', 'Qtd.', 'Preço Unit.', 'Subtotal']],
                body: sale.items.map(item => [
                    item.name,
                    item.quantity,
                    `R$ ${item.price.toFixed(2)}`,
                    `R$ ${(item.price * item.quantity).toFixed(2)}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [30, 41, 59], textColor: '#FFFFFF' },
                footStyles: { fillColor: [241, 245, 249], textColor: '#000000', fontStyle: 'bold' },
                foot: [
                    [{ content: 'Subtotal:', colSpan: 3, styles: { halign: 'right' } }, `R$ ${sale.subtotal.toFixed(2)}`],
                    [{ content: 'Desconto:', colSpan: 3, styles: { halign: 'right' } }, `- R$ ${sale.discount.toFixed(2)}`],
                    [{ content: 'Total Final:', colSpan: 3, styles: { halign: 'right' } }, `R$ ${sale.total.toFixed(2)}`],
                ]
            });
            currentY = doc.lastAutoTable.finalY + 10;
            
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
        };

        if (companyInfo?.logoUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
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
