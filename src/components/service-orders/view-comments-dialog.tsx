
'use client';

import * as React from 'react';
import type { jsPDF } from 'jspdf';
import { Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ServiceOrder, InternalNote } from '@/types';
import { getCompanyInfo } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';


interface ViewCommentsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean, orderId?: string) => void;
  serviceOrder: ServiceOrder | null;
  onCommentAdd: (orderId: string, commentText: string) => void;
}

const sortNotesChronologically = (notes: InternalNote[] | string | undefined): InternalNote[] => {
  if (!notes) return [];
  if (typeof notes === 'string') {
    return [{ user: 'Sistema', date: new Date(0).toISOString(), comment: notes }];
  }
  return [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function ViewCommentsDialog({ isOpen, onOpenChange, serviceOrder, onCommentAdd }: ViewCommentsDialogProps) {
  const [newComment, setNewComment] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && serviceOrder) {
      localStorage.setItem(`os-last-viewed-${serviceOrder.id}`, new Date().toISOString());
      setNewComment('');
    }
  }, [isOpen, serviceOrder]);

  const handleAddComment = () => {
    if (!newComment.trim() || !serviceOrder) return;
    onCommentAdd(serviceOrder.id, newComment.trim());
    setNewComment('');
  };

  const handlePrint = async () => {
    if (!serviceOrder) {
        toast({
            variant: "destructive",
            title: "Erro ao Imprimir",
            description: "Não há dados da OS para gerar o relatório.",
        });
        return;
    }
    
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const companyInfo = await getCompanyInfo();
    const sortedNotes = sortNotesChronologically(serviceOrder.internalNotes);

    const generatePdfContent = (logoImage: HTMLImageElement | null) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 20;
        let textX = margin;
        const logoWidth = 20;
        const logoHeight = 20;
        const logoSpacing = 5;

        if (logoImage) {
            const logoAR = logoImage.width / logoImage.height;
            doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY - 5, logoWidth * logoAR, logoHeight);
            textX = margin + (logoWidth * logoAR) + logoSpacing;
        }

        doc.setFont('helvetica');
        doc.setTextColor('#000000');
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        if (companyInfo?.name) {
            doc.text(companyInfo.name, textX, currentY);
            currentY += 12;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Histórico de Comentários`, margin, currentY);
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`OS: #${serviceOrder.id.slice(-4)} | Cliente: ${serviceOrder.customerName}`, margin, currentY);

        currentY += 10;

        (doc as any).autoTable({
            startY: currentY,
            head: [['Data', 'Usuário', 'Comentário']],
            body: sortedNotes.map(note => [
                new Date(note.date).toLocaleString('pt-BR'),
                note.user,
                note.comment,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], textColor: '#FFFFFF' },
            styles: {
                cellPadding: 3,
                fontSize: 9,
                valign: 'middle',
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 30 },
                2: { cellWidth: 'auto' },
            },
            didParseCell: (data: any) => {
                // For long comments
                if (data.column.index === 2) {
                    data.cell.styles.overflow = 'linebreak';
                }
            },
        });

        doc.output('dataurlnewwindow');
    };

    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.onload = () => generatePdfContent(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        generatePdfContent(null);
      };
      img.src = companyInfo.logoUrl;
    } else {
      generatePdfContent(null);
    }
  };


  if (!serviceOrder) {
    return null;
  }
  
  const sortedNotes = sortNotesChronologically(serviceOrder.internalNotes);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => onOpenChange(open, serviceOrder.id)}>
      <DialogContent className="sm:max-w-xl flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle>Comentários da OS #{serviceOrder.id.slice(-4)}</DialogTitle>
          <DialogDescription>
            Histórico de anotações internas para o atendimento de {serviceOrder.customerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
            <ScrollArea className="h-full w-full rounded-md border p-4 bg-muted/30">
                <div className="space-y-4">
                    {sortedNotes.length > 0 ? (
                        sortedNotes.map((note, index) => (
                            <div key={index} className="text-sm p-3 bg-background rounded-lg shadow-sm">
                                <p className="leading-relaxed">{note.comment}</p>
                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-muted">
                                    Adicionado por <span className="font-semibold">{note.user}</span> em {new Date(note.date).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-muted-foreground">Nenhum comentário interno foi adicionado a esta OS.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        <div className="flex-shrink-0 space-y-2 pt-4">
            <Label htmlFor="new_comment">Adicionar Novo Comentário</Label>
            <div className="flex items-start gap-2">
                <Textarea
                    id="new_comment"
                    placeholder="Adicione observações para a equipe..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                />
            </div>
        </div>
        <DialogFooter className="flex-shrink-0 sm:justify-between">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <div className="flex gap-2">
             <Button variant="ghost" onClick={() => onOpenChange(false, serviceOrder.id)}>Fechar</Button>
             <Button onClick={handleAddComment}>Adicionar Comentário</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
