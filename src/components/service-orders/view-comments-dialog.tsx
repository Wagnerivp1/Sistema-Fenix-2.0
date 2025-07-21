
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { ServiceOrder, InternalNote } from '@/types';

interface ViewCommentsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  serviceOrder: ServiceOrder | null;
}

const sortNotesChronologically = (notes: InternalNote[] = []): InternalNote[] => {
  return [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function ViewCommentsDialog({ isOpen, onOpenChange, serviceOrder }: ViewCommentsDialogProps) {
  if (!serviceOrder) {
    return null;
  }
  
  const sortedNotes = sortNotesChronologically(serviceOrder.internalNotes);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Comentários da OS #{serviceOrder.id.slice(-4)}</DialogTitle>
          <DialogDescription>
            Histórico de anotações internas para o atendimento de {serviceOrder.customerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/30">
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
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
