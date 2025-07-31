
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
import { Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { useToast } from '@/hooks/use-toast';
import type { StockItem } from '@/types';
import { getCompanyInfo } from '@/lib/storage';

interface PrintLabelDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PrintLabelDialog({ item, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const [startPosition, setStartPosition] = React.useState(1);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setStartPosition(1);
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

    const companyInfo = await getCompanyInfo();

    try {
      JsBarcode(canvasRef.current, item.barcode || item.id, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: false,
        fontSize: 10,
        margin: 0,
      });

      const barcodeDataUrl = canvasRef.current.toDataURL('image/png');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const cols = 2;
      const rows = 7;
      const labelWidth = 100;
      const labelHeight = 40;
      
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Margem superior e inferior fixas
      const marginY = 130; 
      // Margem lateral centralizada
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
        const y = marginY + (row * labelHeight);
        const labelCenterX = x + (labelWidth / 2);

        // Desenha a borda da etiqueta para facilitar o recorte
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, labelWidth, labelHeight);
        
        let contentY = y + 7;

        // 1. Nome da Empresa
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name || '', labelCenterX, contentY, { align: 'center' });
        contentY += 6;

        // 2. Nome do Produto
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const productNameLines = doc.splitTextToSize(item.name, labelWidth - 10);
        doc.text(productNameLines, labelCenterX, contentY, { align: 'center' });
        // Ajusta a posição Y com base na altura do texto do nome do produto
        contentY += (doc.getTextDimensions(productNameLines).h) + 2;
        
        // 3. Código de Barras
        const barcodeWidth = 40;
        const barcodeHeight = 10;
        const barcodeX = labelCenterX - (barcodeWidth / 2);
        doc.addImage(barcodeDataUrl, 'PNG', barcodeX, contentY, barcodeWidth, barcodeHeight);
        contentY += barcodeHeight + 2; // Move Y para depois do código de barras
        
        // 4. Preço - Posicionado na parte inferior da etiqueta
        const priceY = y + labelHeight - 5;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, labelCenterX, priceY, { align: 'center' });
        
        count++;
      }

      doc.autoPrint();
      doc.output('dataurlnewwindow');
      onOpenChange(false);

    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar etiqueta',
        description: 'Verifique se o código de barras é válido.',
      });
    }
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
            <DialogTitle>Imprimir Etiqueta</DialogTitle>
            <DialogDescription>
              Configure a impressão para o item <span className="font-semibold">{item?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-2 gap-4">
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
             <div className="space-y-2">
                <Label htmlFor="startPosition">Posição Inicial (1-14)</Label>
                <Input 
                  id="startPosition" 
                  type="number" 
                  value={startPosition}
                  onChange={handleStartPositionChange}
                  min="1"
                  max="14"
                />
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
