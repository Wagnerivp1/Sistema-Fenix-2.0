
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Printer, Sheet, ReceiptText } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { useToast } from '@/hooks/use-toast';
import type { StockItem, CompanyInfo } from '@/types';
import { getCompanyInfo } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface PrintLabelDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PrintLabelDialog({ item, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const [startPosition, setStartPosition] = React.useState(1);
  const [printType, setPrintType] = React.useState<'a4' | 'thermal'>('a4');
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setStartPosition(1);
      setPrintType('a4');
    }
  }, [isOpen]);

  const handlePrint = async () => {
    if (!item || !canvasRef.current) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Item não encontrado ou erro ao gerar código de barras.',
      });
      return;
    }

    try {
      JsBarcode(canvasRef.current, item.barcode || item.id, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 0,
      });

      const barcodeDataUrl = canvasRef.current.toDataURL('image/png');
      const companyInfo = await getCompanyInfo();

      if (printType === 'a4') {
        generateA4Pdf(barcodeDataUrl, companyInfo);
      } else {
        generateThermalPdf(barcodeDataUrl, companyInfo);
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar etiqueta',
        description: 'Verifique se o código de barras é válido.',
      });
    }
  };

  const generateA4Pdf = (barcodeDataUrl: string, companyInfo: CompanyInfo) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const cols = 2;
    const rows = 7;
    const labelWidth = 100;
    const labelHeight = 40;
    
    const pageHeight = 297;
    const pageWidth = 210;
    
    // Using fixed top margin as requested
    const marginY = 13; 
    const verticalSpacing = 4; // 4mm spacing
    const marginX = (pageWidth - (cols * labelWidth)) / 2;

    let count = startPosition - 1;
    for (let i = 0; i < quantity; i++) {
      if (count >= cols * rows) {
        doc.addPage();
        count = 0;
      }

      const row = Math.floor(count / cols);
      const col = count % cols;

      const x = marginX + (col * labelWidth);
      const y = marginY + (row * (labelHeight + verticalSpacing));
      const labelCenterX = x + (labelWidth / 2);

      let contentY = y + 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(companyInfo.name || '', labelCenterX, contentY, { align: 'center' });
      contentY += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const productNameLines = doc.splitTextToSize(item!.name, labelWidth - 10);
      doc.text(productNameLines, labelCenterX, contentY, { align: 'center' });
      contentY += (doc.getTextDimensions(productNameLines).h);
      
      const barcodeWidth = 40;
      const barcodeHeight = 10;
      const barcodeX = labelCenterX - (barcodeWidth / 2);
      // Ensure barcode doesn't overlap with price
      const barcodeY = y + labelHeight - 5 - barcodeHeight - 2;
      doc.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
      
      const priceY = y + labelHeight - 5;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${item!.price.toFixed(2)}`, labelCenterX, priceY, { align: 'center' });
      
      count++;
    }

    doc.autoPrint();
    doc.output('dataurlnewwindow');
    onOpenChange(false);
  }

  const generateThermalPdf = (barcodeDataUrl: string, companyInfo: CompanyInfo) => {
    const pageWidth = 80;
    const margin = 5;
    
    // Calculate total height needed
    let totalHeight = 0;
    const tempDoc = new jsPDF(); // Use a temporary doc for measurements
    
    totalHeight += 5; // top margin
    totalHeight += tempDoc.getTextDimensions(companyInfo.name || 'Sua Loja', { fontSize: 11, fontStyle: 'bold' }).h;
    totalHeight += 5;
    const productNameLines = tempDoc.splitTextToSize(item!.name, pageWidth - 10);
    totalHeight += tempDoc.getTextDimensions(productNameLines, { fontSize: 9 }).h;
    totalHeight += 2;
    totalHeight += 10; // barcode height
    totalHeight += 2;
    totalHeight += tempDoc.getTextDimensions(`R$ ${item!.price.toFixed(2)}`, { fontSize: 14, fontStyle: 'bold' }).h;
    totalHeight += 5; // bottom margin

    const doc = new jsPDF({ unit: 'mm', format: [pageWidth, totalHeight] });

    for (let i = 0; i < quantity; i++) {
        if (i > 0) {
            doc.addPage([pageWidth, totalHeight]);
        }
        
        const startY = 5;
        let y = startY;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name || 'Sua Loja', pageWidth / 2, y, { align: 'center' });
        y += 5;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(productNameLines, pageWidth / 2, y, { align: 'center' });
        y += (tempDoc.getTextDimensions(productNameLines, { fontSize: 9 }).h) + 2;

        const barcodeWidth = 45;
        const barcodeHeight = 10;
        doc.addImage(barcodeDataUrl, 'PNG', (pageWidth - barcodeWidth) / 2, y, barcodeWidth, barcodeHeight);
        y += barcodeHeight + 2;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item!.price.toFixed(2)}`, pageWidth / 2, y, { align: 'center' });
    }

    doc.autoPrint();
    doc.output('dataurlnewwindow');
    onOpenChange(false);
  };
  
  const handleStartPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const maxLabels = 14; 
    if (isNaN(value) || value < 1) {
        setStartPosition(1);
    } else if (value > maxLabels) {
        setStartPosition(maxLabels);
    } else {
        setStartPosition(value);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imprimir Etiqueta de Produto</DialogTitle>
            <DialogDescription>
              Configure a impressão para o item <span className="font-semibold">{item?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <RadioGroup value={printType} onValueChange={(val) => setPrintType(val as 'a4' | 'thermal')}>
              <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                <RadioGroupItem value="a4" id="a4"/>
                <Label htmlFor="a4" className="flex-1 cursor-pointer flex items-center gap-3">
                  <Sheet className="w-5 h-5 text-primary"/>
                  Impressora Comum (A4)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                <RadioGroupItem value="thermal" id="thermal"/>
                <Label htmlFor="thermal" className="flex-1 cursor-pointer flex items-center gap-3">
                  <ReceiptText className="w-5 h-5 text-primary"/>
                  Impressora Térmica (80mm)
                </Label>
              </div>
            </RadioGroup>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade de Etiquetas</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                  />
              </div>
               <div className={cn("space-y-2", printType === 'thermal' && 'opacity-50')}>
                  <Label htmlFor="startPosition">Posição Inicial (1-14)</Label>
                  <Input 
                    id="startPosition" 
                    type="number" 
                    value={startPosition}
                    onChange={handleStartPositionChange}
                    min="1"
                    max="14"
                    disabled={printType === 'thermal'}
                  />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
