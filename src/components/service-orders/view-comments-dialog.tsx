
'use client';

import * as React from 'react';
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

interface ViewCommentsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  serviceOrder: ServiceOrder | null;
  onCommentAdd: (orderId: string, commentText: string) => void;
}

const sortNotesChronologically = (notes: InternalNote[] | string | undefined): InternalNote[] => {
  if (!notes) return [];
  // Retrocompatibilidade: se for uma string, converte para o formato de array
  if (typeof notes === 'string') {
    return [{ user: 'Sistema', date: new Date(0).toISOString(), comment: notes }];
  }
  return [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function ViewCommentsDialog({ isOpen, onOpenChange, serviceOrder, onCommentAdd }: ViewCommentsDialogProps) {
  const [newComment, setNewComment] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setNewComment('');
    }
  }, [isOpen]);

  const handleAddComment = () => {
    if (!newComment.trim() || !serviceOrder) return;
    onCommentAdd(serviceOrder.id, newComment.trim());
    setNewComment('');
  };

  if (!serviceOrder) {
    return null;
  }
  
  const sortedNotes = sortNotesChronologically(serviceOrder.internalNotes);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleAddComment}>Adicionar Comentário</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
