
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
import type { ServiceOrder, InternalNote, User } from '@/types';
import { getLoggedInUser, saveServiceOrders, getServiceOrders } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface ViewCommentsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  serviceOrder: ServiceOrder | null;
  onCommentAdded: (updatedOrder: ServiceOrder) => void;
}

const sortNotesChronologically = (notes: InternalNote[] = []): InternalNote[] => {
  return [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function ViewCommentsDialog({ isOpen, onOpenChange, serviceOrder, onCommentAdded }: ViewCommentsDialogProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [newComment, setNewComment] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setCurrentUser(getLoggedInUser());
      setNewComment('');
    }
  }, [isOpen]);

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser || !serviceOrder) return;

    const commentToAdd: InternalNote = {
      user: currentUser.name,
      date: new Date().toISOString(),
      comment: newComment.trim(),
    };

    // Garantir que internalNotes seja um array
    const existingNotes = Array.isArray(serviceOrder.internalNotes) ? serviceOrder.internalNotes : [];

    const updatedOrder = {
      ...serviceOrder,
      internalNotes: [...existingNotes, commentToAdd],
    };

    // Ler todas as OS, atualizar a específica e salvar de volta no localStorage
    const allOrders = getServiceOrders();
    const updatedOrders = allOrders.map(o => o.id === serviceOrder.id ? updatedOrder : o);
    saveServiceOrders(updatedOrders);

    // Notificar o componente pai e limpar o estado local
    onCommentAdded(updatedOrder);
    setNewComment('');
    toast({
      title: 'Comentário Adicionado!',
      description: 'A anotação foi salva na OS.',
    });
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
