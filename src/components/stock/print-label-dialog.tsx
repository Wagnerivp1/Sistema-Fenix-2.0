
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

interface PrintLabelDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PrintLabelDialog({ item, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  const handlePrint = () => {
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
        height: 25,
        displayValue: true,
        fontSize: 10,
        margin: 0,
      });

      const barcodeDataUrl = canvasRef.current.toDataURL('image/png');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Layout para 2 colunas e 15 linhas (etiqueta 99mm x 19mm)
      const cols = 2;
      const rows = 15;
      const labelWidth = 99;
      const labelHeight = 19;
      const pageHeight = 297;
      const pageWidth = 210;
      
      const marginX = (pageWidth - (cols * labelWidth)) / 2;
      const marginY = (pageHeight - (rows * labelHeight)) / 2;

      let count = 0;
      for (let i = 0; i < quantity; i++) {
        if (count >= cols * rows) {
          doc.addPage();
          count = 0;
        }

        const row = Math.floor(count / cols);
        const col = count % cols;

        const x = marginX + (col * labelWidth);
        const y = marginY + (row * labelHeight);

        // Alinhamento do conteúdo dentro da etiqueta
        const contentX = x + 2;
        const contentY = y + 3;

        // Nome do produto (truncado se necessário)
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(item.name, contentX, contentY, { maxWidth: labelWidth - 10 });

        // Código de barras
        doc.addImage(barcodeDataUrl, 'PNG', contentX, contentY + 1.5, labelWidth - 10, 8);
        
        // Preço
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, contentX, contentY + 13);
        
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

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imprimir Etiqueta</DialogTitle>
            <DialogDescription>
              Quantas etiquetas de <span className="font-semibold">{item?.name}</span> você deseja imprimir?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quantity">Quantidade de Etiquetas</Label>
            <Input 
              id="quantity" 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
            />
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
