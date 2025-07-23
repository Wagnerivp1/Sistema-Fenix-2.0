
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
import { Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { getCompanyInfo } from '@/lib/storage';
import type { Sale, CompanyInfo } from '@/types';

interface PrintSaleReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale: Sale | null;
}

const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatValue = (value: number) => {
    const s = value.toFixed(2);
    return s.length.toString().padStart(2, '0') + s;
};

const formatText = (id: string, text: string) => {
    const s = text.trim();
    return id + s.length.toString().padStart(2, '0') + s;
};

const getCrc16 = (payload: string) => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (const b of payload) {
        for (let i = 0; i < 8; i++) {
            const bit = ((b.charCodeAt(0) >> (7 - i) & 1) == 1);
            const c15 = ((crc >> 15 & 1) == 1);
            crc <<= 1;
            if (c15 ^ bit) crc ^= polynomial;
        }
    }
    crc &= 0xFFFF;
    return '6304' + crc.toString(16).toUpperCase().padStart(4, '0');
};

const generatePixPayload = (companyInfo: CompanyInfo, sale: { total: number, id: string }) => {
    const payload = [
        formatText('00', '01'),
        formatText('26', formatText('00', 'br.gov.bcb.pix') + formatText('01', companyInfo.pixKey)),
        formatText('52', '0000'),
        formatText('53', '986'),
        formatValue(sale.total),
        formatText('58', 'BR'),
        formatText('59', companyInfo.name.substring(0, 25)),
        formatText('60', '***'),
        formatText('62', formatText('05', sale.id.slice(-25))),
    ];
    const payloadString = payload.join('');
    return payloadString + getCrc16(payloadString);
};

export function PrintSaleReceiptDialog({ isOpen, onOpenChange, sale }: PrintSaleReceiptDialogProps) {
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!sale) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Dados da venda não encontrados.' });
      return;
    }
    const companyInfo = await getCompanyInfo();
    generateThermalPdf(sale, companyInfo);
  };

  const generateThermalPdf = async (saleData: Sale, info: CompanyInfo) => {
    try {
        const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
        const pageWidth = 80;
        const margin = 5;
        let y = 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(info.name || 'Sua Empresa', pageWidth / 2, y, { align: 'center' });
        y += 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        if (info.address) { doc.text(info.address, pageWidth / 2, y, { align: 'center' }); y+=4; }
        if (info.phone) { doc.text(`Telefone: ${info.phone}`, pageWidth / 2, y, { align: 'center' }); y+=4; }
        if (info.document) { doc.text(`CNPJ: ${info.document}`, pageWidth / 2, y, { align: 'center' }); y+=4; }
        
        y += 2;
        doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
        y += 4;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPROVANTE DE VENDA', pageWidth / 2, y, { align: 'center' });
        y += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formatDateForDisplay(saleData.date)} - ${saleData.time}`, margin, y);
        doc.text(`Venda #${saleData.id.slice(-6)}`, pageWidth - margin, y, { align: 'right'});
        y += 5;
        doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
        y += 5;

        // Table
        doc.autoTable({
            startY: y,
            head: [['Item', 'Qtd', 'Vlr. Unit.', 'Total']],
            body: saleData.items.map(item => [item.name, item.quantity, item.price.toFixed(2), (item.price * item.quantity).toFixed(2)]),
            theme: 'plain',
            styles: {
                fontSize: 8,
                cellPadding: {top: 0.5, right: 1, bottom: 0.5, left: 0},
            },
            headStyles: { fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 8, halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
            },
            margin: { left: margin, right: margin }
        });
        y = doc.lastAutoTable.finalY + 2;
        
        doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
        y += 5;

        const summaryX = pageWidth - margin;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal:', summaryX - 20, y, { align: 'right' });
        doc.text(`R$ ${saleData.subtotal.toFixed(2)}`, summaryX, y, { align: 'right' });
        y += 5;
        doc.text('Desconto:', summaryX - 20, y, { align: 'right' });
        doc.text(`- R$ ${saleData.discount.toFixed(2)}`, summaryX, y, { align: 'right' });
        y += 5;
        doc.setFontSize(12);
        doc.text('TOTAL:', summaryX - 20, y, { align: 'right' });
        doc.text(`R$ ${saleData.total.toFixed(2)}`, summaryX, y, { align: 'right' });
        y += 8;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Forma de Pagamento: ${saleData.paymentMethod}`, margin, y);
        y += 6;
        
        doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
        y += 6;

        if (saleData.paymentMethod === 'pix' && info.pixKey) {
            const pixload = generatePixPayload(info, saleData);
            const qrCodeImage = await QRCode.toDataURL(pixload, { width: 150 });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Pague com PIX!', pageWidth / 2, y, { align: 'center' });
            y+= 5;
            doc.addImage(qrCodeImage, 'PNG', (pageWidth / 2) - 25, y, 50, 50);
            y += 55;
        }

        const barcodeCanvas = document.createElement('canvas');
        JsBarcode(barcodeCanvas, saleData.id, {
            format: "CODE128", width: 1.5, height: 30, displayValue: false, margin: 0
        });
        doc.addImage(barcodeCanvas.toDataURL('image/png'), 'PNG', (pageWidth / 2) - 25, y, 50, 15);
        y += 20;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Obrigado pela sua preferência!', pageWidth / 2, y, { align: 'center' });

        doc.autoPrint();
        doc.output('dataurlnewwindow');
        onOpenChange(false);
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro ao gerar cupom', description: 'Ocorreu um problema ao criar o PDF.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Cupom de Venda</DialogTitle>
          <DialogDescription>
            A venda foi finalizada com sucesso. Deseja imprimir o cupom?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-8 bg-muted rounded-md">
            <Printer className="w-20 h-20 text-muted-foreground" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Cupom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
