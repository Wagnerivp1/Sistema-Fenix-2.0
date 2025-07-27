
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

      const cols = 3;
      const rows = 10;
      const labelWidth = 63.5;
      const labelHeight = 29.6;
      const marginX = (210 - (cols * labelWidth)) / 2;
      const marginY = (297 - (rows * labelHeight)) / 2;

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

        // Nome do produto
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(item.name, x + 2, y + 5, { maxWidth: labelWidth - 4 });

        // Código de barras
        doc.addImage(barcodeDataUrl, 'PNG', x + 2, y + 8, labelWidth - 4, 10);
        
        // Preço
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, x + 2, y + 25);
        
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
