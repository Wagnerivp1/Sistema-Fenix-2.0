
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
        svgElement.setAttribute('width', '300');
        svgElement.setAttribute('height', '60');

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        
        canvas.width = 300;
        canvas.height = 60;

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            onRender(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = () => {
          console.error("Failed to load SVG image for barcode.");
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      }
    }
  }, [value, onRender]);

  return (
    <div ref={barcodeRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      <Barcode value={value || 'error'} width={1.2} height={30} fontSize={10} background="#FFFFFF" margin={2} />
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
        description: 'Não foi possível gerar a etiqueta. Verifique se o código de barras foi renderizado.',
      });
      return;
    }
    
    const doc = new jsPDF();
    
    const labelWidth = 40;
    const labelHeight = 20;
    const margin = { top: 10, left: 10 };
    const gap = { x: 3, y: 3 };
    const page = { width: 210, height: 297 };

    let currentX = margin.left;
    let currentY = margin.top;
    
    for(let i = 0; i < quantity; i++) {
        if (currentX + labelWidth > page.width - margin.left) {
            currentX = margin.left;
            currentY += labelHeight + gap.y;
        }

        if (currentY + labelHeight > page.height - margin.top) {
            doc.addPage();
            currentY = margin.top;
            currentX = margin.left;
        }
        
        const centerX = currentX + labelWidth / 2;

        // Borda da etiqueta
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, labelWidth, labelHeight);
        
        // Conteúdo
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('jl iNFORMÁTICA', centerX, currentY + 3, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const productNameLines = doc.splitTextToSize(item.name, labelWidth - 4);
        doc.text(productNameLines, centerX, currentY + 6.5, { align: 'center', maxWidth: labelWidth - 4 });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${item.price.toFixed(2)}`, centerX, currentY + 13, { align: 'center' });

        if (barcodeDataUrl) {
            doc.addImage(barcodeDataUrl, 'PNG', currentX + 3, currentY + 14, 34, 5);
        }

        currentX += labelWidth + gap.x;
    }

    doc.output('dataurlnewwindow');
    onOpenChange(false);
  };
  
  if (!item) return null;

  return (
    <>
      {isOpen && item.barcode && <BarcodeRenderer value={item.barcode} onRender={setBarcodeDataUrl} />}
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
