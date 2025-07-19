
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
import Barcode from 'react-barcode';

interface PrintLabelDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Componente invisível para renderizar o código de barras e obter a imagem
const BarcodeRenderer = ({ value, onRender }: { value: string; onRender: (dataUrl: string) => void }) => {
  const barcodeRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (barcodeRef.current) {
      const svgElement = barcodeRef.current.querySelector('svg');
      if (svgElement) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          onRender(canvas.toDataURL('image/png'));
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
      }
    }
  }, [value, onRender]);

  return (
    <div ref={barcodeRef} style={{ display: 'none' }}>
      <Barcode value={value} width={1} height={20} fontSize={10} />
    </div>
  );
};


export function PrintLabelDialog({ item, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const [barcodeDataUrl, setBarcodeDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setBarcodeDataUrl(null);
    }
  }, [isOpen]);

  const handlePrint = () => {
    if (!item || !barcodeDataUrl) {
      toast({
        variant: 'destructive',
        title: 'Erro de Impressão',
        description: 'Não foi possível gerar a etiqueta. Tente novamente.',
      });
      return;
    }
    
    const doc = new jsPDF();
    
    // Configurações da etiqueta (em mm)
    const labelWidth = 40;
    const labelHeight = 25;
    const margin = { top: 10, left: 10 };
    const gap = { x: 5, y: 5 };

    // Configurações da página A4 (210x297 mm)
    const page = { width: 210, height: 297 };

    let currentX = margin.left;
    let currentY = margin.top;
    
    for(let i = 0; i < quantity; i++) {
        // Verifica se a etiqueta cabe na linha atual
        if (currentX + labelWidth > page.width) {
            currentX = margin.left;
            currentY += labelHeight + gap.y;
        }

        // Verifica se a etiqueta cabe na página atual
        if (currentY + labelHeight > page.height) {
            doc.addPage();
            currentY = margin.top;
            currentX = margin.left;
        }

        // Desenha a borda da etiqueta (opcional)
        // doc.rect(currentX, currentY, labelWidth, labelHeight);
        
        // Adiciona conteúdo
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('jl iNFORMÁTICA', currentX + 2, currentY + 4);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const productName = doc.splitTextToSize(item.name, labelWidth - 4);
        doc.text(productName, currentX + 2, currentY + 8);
        
        const priceY = currentY + (productName.length > 1 ? 14 : 11);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, currentX + 2, priceY);

        // Adiciona o código de barras
        if (barcodeDataUrl) {
            doc.addImage(barcodeDataUrl, 'PNG', currentX + 2, currentY + 15, 36, 8);
        }

        // Move para a próxima posição
        currentX += labelWidth + gap.x;
    }

    doc.output('dataurlnewwindow');
    onOpenChange(false);
  };
  
  if (!item) return null;

  return (
    <>
      <BarcodeRenderer value={item.barcode} onRender={setBarcodeDataUrl} />
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
              <Button onClick={handlePrint} disabled={!barcodeDataUrl}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
