
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
        JsBarcode(canvasRef.current, item.barcode, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 14
        });
        
        const barcodeDataUrl = canvasRef.current.toDataURL('image/png');

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [40, 60] // Formato aproximado da etiqueta
        });
        
        for (let i = 0; i < quantity; i++) {
            if (i > 0) doc.addPage();
            doc.setFontSize(10);
            doc.text(item.name, 3, 7, { maxWidth: 54 });
            doc.addImage(barcodeDataUrl, 'PNG', 3, 10, 54, 15);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`R$ ${item.price.toFixed(2)}`, 3, 33);
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
