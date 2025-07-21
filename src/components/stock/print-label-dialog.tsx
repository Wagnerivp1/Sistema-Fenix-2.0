
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

// This component is now only for triggering the dialog.
// The barcode logic is moved directly into the handlePrint function.
export function PrintLabelDialog({ item, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
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

    if (quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Quantidade Inválida',
        description: 'Por favor, insira um número de etiquetas maior que zero.',
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
      let col = 0;
      
      for(let i = 0; i < quantity; i++) {
        if (col >= numCols) {
          col = 0;
          currentX = margin.left;
          currentY += labelHeight + gap.y;
        }

        if (currentY + labelHeight > page.height - margin.top) {
          doc.addPage();
          currentY = margin.top;
          currentX = margin.left;
          col = 0;
        }
        
        currentX = margin.left + (col * (labelWidth + gap.x));

        const centerX = currentX + labelWidth / 2;

        // Borda da etiqueta (opcional, para visualização)
        doc.setDrawColor(220, 220, 220);
        doc.rect(currentX, currentY, labelWidth, labelHeight);
        
        // 1. Nome da Empresa
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name || 'Sua Empresa', centerX, currentY + 5, { align: 'center' });

        // 2. Nome do Produto
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const productNameLines = doc.splitTextToSize(item.name, labelWidth - 10);
        doc.text(productNameLines, centerX, currentY + 11, { align: 'center', maxWidth: labelWidth - 10 });
        
        // 3. Preço
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, centerX, currentY + 22, { align: 'center' });
        
        // 4. Código de Barras
        // Criamos um canvas temporário para gerar o barcode e depois o adicionamos como imagem.
        // Isso nos dá mais controle sobre a qualidade e o formato.
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
            currentX + 15, // centraliza o código
            currentY + 26, // posiciona abaixo do preço
            70, // largura do código de barras
            12  // altura do código de barras
        );

        col++;
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
              Quantas etiquetas para <span className="font-semibold text-foreground">{item.name}</span> você deseja imprimir?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
