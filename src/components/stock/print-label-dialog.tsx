
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
import { getCompanyInfo } from '@/lib/storage';

interface PrintLabelDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const BarcodeSvgRenderer = ({ value, onRender }: { value: string; onRender: (svgString: string) => void }) => {
  const barcodeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (barcodeRef.current) {
      const svgElement = barcodeRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.setAttribute('width', '300');
        svgElement.setAttribute('height', '80');
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        onRender(svgString);
      }
    }
  }, [value, onRender]);

  return (
    <div ref={barcodeRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -100 }}>
      <Barcode value={value || 'error'} width={2} height={40} fontSize={14} background="#FFFFFF" margin={5} />
    </div>
  );
};

export function PrintLabelDialog({ item, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const [barcodeSvgString, setBarcodeSvgString] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setBarcodeSvgString(null);
    }
  }, [isOpen]);

  const handlePrint = async () => {
    if (!item || !barcodeSvgString) {
      toast({
        variant: 'destructive',
        title: 'Erro de Impressão',
        description: 'Não foi possível gerar a etiqueta. O código de barras não está pronto.',
      });
      return;
    }

    const companyInfo = await getCompanyInfo();

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        if (!ctx) return;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const barcodeDataUrl = canvas.toDataURL('image/png');

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

            doc.setDrawColor(220, 220, 220);
            doc.rect(currentX, currentY, labelWidth, labelHeight);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(companyInfo.name || 'Sua Empresa', centerX, currentY + 5, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const productNameLines = doc.splitTextToSize(item.name, labelWidth - 10);
            doc.text(productNameLines, centerX, currentY + 11, { align: 'center', maxWidth: labelWidth - 10 });

            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(`R$ ${item.price.toFixed(2)}`, centerX, currentY + 22, { align: 'center' });
            
            doc.addImage(barcodeDataUrl, 'PNG', currentX + 15, currentY + 26, 70, 12);

            col++;
        }

        doc.output('dataurlnewwindow');
        onOpenChange(false);
    };

    img.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Erro de Imagem',
        description: 'Falha ao carregar a imagem do código de barras SVG.',
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(barcodeSvgString)));
  };
  
  if (!item) return null;

  return (
    <>
      {isOpen && item.id && <BarcodeSvgRenderer value={item.id} onRender={setBarcodeSvgString} />}
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
              <Button onClick={handlePrint} disabled={!barcodeSvgString}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
