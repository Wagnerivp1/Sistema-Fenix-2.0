
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Printer, ReceiptText, Sheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { getCompanyInfo } from '@/lib/storage';
import type { FinancialTransaction, CompanyInfo } from '@/types';

interface PrintReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: FinancialTransaction | null;
}

const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export function PrintReceiptDialog({ isOpen, onOpenChange, transaction }: PrintReceiptDialogProps) {
  const [printType, setPrintType] = React.useState<'a4' | 'thermal'>('a4');
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!transaction) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Transação não encontrada.' });
      return;
    }

    const companyInfo = await getCompanyInfo();

    if (printType === 'a4') {
      generateA4Pdf(transaction, companyInfo);
    } else {
      generateThermalPdf(transaction, companyInfo);
    }
  };

  const generateA4Pdf = (tx: FinancialTransaction, info: CompanyInfo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const fontColor = '#000000';
    let currentY = 12;

    const img = new Image();
    img.src = info.logoUrl;
    img.onload = () => {
        if (info.logoUrl) {
            doc.addImage(img, img.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY, 25, 25);
        }
        
        const companyInfoX = margin + (info.logoUrl ? 30 : 0);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(fontColor);
        doc.setFontSize(16);
        doc.text(info.name || "Recibo", companyInfoX, currentY + 10);
        
        const title = tx.type === 'receita' ? 'Recibo de Receita' : 'Comprovante de Despesa';
        doc.setFontSize(20);
        doc.text(title, pageWidth / 2, currentY + 30, { align: 'center' });
        currentY += 45;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Pelo presente, declaramos ter ${tx.type === 'receita' ? 'recebido' : 'pago'} a quantia de:`, margin, currentY);
        currentY += 10;
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${tx.amount.toFixed(2)}`, margin, currentY);
        currentY += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Referente a: ${tx.description}`, margin, currentY);
        currentY += 15;

        doc.autoTable({
            startY: currentY,
            theme: 'plain',
            styles: { fontSize: 10 },
            body: [
            [{content: 'Data:', styles: {fontStyle: 'bold'}}, formatDateForDisplay(tx.date)],
            [{content: 'Forma de Pag.:', styles: {fontStyle: 'bold'}}, tx.paymentMethod],
            [{content: 'Categoria:', styles: {fontStyle: 'bold'}}, tx.category],
            ],
            columnStyles: { 0: { cellWidth: 35 } },
        });
        currentY = doc.lastAutoTable.finalY + 30;

        const city = info.address?.split('-')[0]?.split(',')[1]?.trim() || "___________________";
        doc.text(`${city}, ${new Date().toLocaleDateString('pt-BR')}.`, pageWidth / 2, currentY, { align: 'center'});
        currentY += 20;

        doc.line(margin + 40, currentY, pageWidth - margin - 40, currentY);
        doc.text(info.name || 'Assinatura', pageWidth / 2, currentY + 5, { align: 'center'});
        
        doc.autoPrint();
        doc.output('dataurlnewwindow');
    };
    img.onerror = () => generateA4Pdf(tx, { ...info, logoUrl: '' });

    if (!info.logoUrl) {
      img.onload();
    }
  };

  const generateThermalPdf = (tx: FinancialTransaction, info: CompanyInfo) => {
    // 80mm width paper
    const doc = new jsPDF({ unit: 'mm', format: [80, 297] });
    const pageWidth = 80;
    const margin = 5;
    let y = 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(info.name || 'Recibo', pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(info.address || '', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Telefone: ${info.phone || ''}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`CNPJ: ${info.document || ''}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    
    doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;
    
    const title = tx.type === 'receita' ? 'RECIBO DE RECEITA' : 'COMPROVANTE DE DESPESA';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formatDateForDisplay(tx.date)}`, margin, y);
    y += 5;

    doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    doc.text(tx.description, margin, y, { maxWidth: pageWidth - margin * 2 });
    y += (doc.getTextDimensions(tx.description, { maxWidth: pageWidth - margin * 2 }).h) + 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${tx.amount.toFixed(2)}`, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pagamento: ${tx.paymentMethod}`, margin, y);
    y += 5;

    doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    doc.line(margin + 10, y, pageWidth - margin - 10, y);
    y += 4;
    doc.text('Assinatura', pageWidth / 2, y, { align: 'center' });

    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Recibo</DialogTitle>
          <DialogDescription>
            Escolha o tipo de impressora para gerar o recibo da transação.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <RadioGroup defaultValue="a4" value={printType} onValueChange={(val) => setPrintType(val as 'a4' | 'thermal')}>
                <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                    <RadioGroupItem value="a4" id="a4"/>
                    <Label htmlFor="a4" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Sheet className="w-6 h-6 text-primary"/>
                            <div>
                                <p className="font-semibold">Impressora Comum (A4)</p>
                                <p className="text-xs text-muted-foreground">Para impressoras laser ou jato de tinta.</p>
                            </div>
                        </div>
                    </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                    <RadioGroupItem value="thermal" id="thermal"/>
                    <Label htmlFor="thermal" className="flex-1 cursor-pointer">
                         <div className="flex items-center gap-3">
                            <ReceiptText className="w-6 h-6 text-primary"/>
                            <div>
                                <p className="font-semibold">Impressora Térmica (80mm)</p>
                                <p className="text-xs text-muted-foreground">Para recibos em formato de cupom.</p>
                            </div>
                        </div>
                    </Label>
                </div>
            </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Confirmar Impressão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
