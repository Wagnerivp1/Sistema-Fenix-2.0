
'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
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

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setStartPosition(1);
    }
  }, [isOpen]);

  const handlePrint = async () => {
    if (!item || !item.barcode) {
      toast({
        variant: 'destructive',
        title: 'Erro de Impressão',
        description: 'O item selecionado não possui um código de barras válido.',
      });
      return;
    }

    if (quantity <= 0 || startPosition <=0 || startPosition > 14) {
      toast({
        variant: 'destructive',
        title: 'Valores Inválidos',
        description: 'Verifique a quantidade e a posição inicial (deve ser entre 1 e 14).',
      });
      return;
    }

    const companyInfo = await getCompanyInfo();

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const labelWidth = 100;
      const labelHeight = 40;
      const page = { width: 210, height: 297 };
      const margin = { top: 10, left: 5 };
      const gap = { x: 0, y: 0 };
      const numCols = 2;

      let currentX = margin.left;
      let currentY = margin.top;
      
      const totalCellsToProcess = (startPosition - 1) + quantity;

      for(let i = 0; i < totalCellsToProcess; i++) {
        const col = i % numCols;
        const row = Math.floor(i / numCols);

        currentX = margin.left + (col * (labelWidth + gap.x));
        currentY = margin.top + (row * (labelHeight + gap.y));
        
        if (currentY + labelHeight > page.height - margin.top) {
          // This logic is simple, it doesn't span pages.
          // For a more complex scenario, we would add doc.addPage() here.
          break;
        }

        // Only print the label if we are past the start position offset
        if (i < startPosition - 1) {
          continue;
        }
        
        // Borda da etiqueta
        doc.setLineWidth(0.8);
        doc.setDrawColor(0, 0, 0); // Cor da borda preta
        doc.rect(currentX + 1, currentY + 1, labelWidth - 2, labelHeight - 2, 'S'); // 'S' para stroke
        
        const centerX = currentX + labelWidth / 2;
        
        // 1. Nome da Empresa
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name || 'Sua Empresa', centerX, currentY + 7, { align: 'center' });

        // 2. Nome do Produto
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const productNameLines = doc.splitTextToSize(item.name, labelWidth - 10);
        doc.text(productNameLines, centerX, currentY + 13, { align: 'center', maxWidth: labelWidth - 10 });
        
        // 3. Preço
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, centerX, currentY + 24, { align: 'center' });
        
        // 4. Código de Barras
        const barcodeCanvas = document.createElement('canvas');
        JsBarcode(barcodeCanvas, item.barcode, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 14,
            margin: 5
        });
        
        doc.addImage(
            barcodeCanvas.toDataURL('image/png'),
            'PNG',
            currentX + 15,
            currentY + 28,
            70,
            10
        );
      }

      doc.output('dataurlnewwindow');
      onOpenChange(false);

    } catch (error) {
       console.error("JsBarcode error:", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao gerar código de barras',
        description: 'Verifique se o código do produto é válido. Ele pode conter caracteres não suportados.',
      });
    }
  };
  
  if (!item) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imprimir Etiquetas</DialogTitle>
            <DialogDescription>
              Imprimir etiquetas para <span className="font-semibold text-foreground">{item.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade de Etiquetas</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1"
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))} 
                    className="text-center text-lg font-bold"
                   />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="startPosition">Iniciar na etiqueta nº</Label>
                  <Input 
                    id="startPosition" 
                    type="number" 
                    min="1"
                    max="14"
                    value={startPosition} 
                    onChange={(e) => setStartPosition(Number(e.target.value))} 
                    className="text-center text-lg font-bold"
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
