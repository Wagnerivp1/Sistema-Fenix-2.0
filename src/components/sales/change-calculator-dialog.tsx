
'use client';

import * as React from 'react';
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

interface ChangeCalculatorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  total: number;
  onConfirm: () => void;
}

export function ChangeCalculatorDialog({
  isOpen,
  onOpenChange,
  total,
  onConfirm,
}: ChangeCalculatorDialogProps) {
  const [amountPaid, setAmountPaid] = React.useState<number | string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAmountPaid('');
      // Focus the input when the dialog opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const change = (Number(amountPaid) || 0) - total;

  const handleConfirm = () => {
    onConfirm();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calcular Troco</DialogTitle>
          <DialogDescription>
            Insira o valor recebido do cliente para calcular o troco.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="text-center">
            <Label className="text-lg">Total da Venda</Label>
            <p className="text-4xl font-bold text-primary">
              R$ {total.toFixed(2)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount-paid" className="text-lg">
              Valor Recebido
            </Label>
            <Input
              id="amount-paid"
              ref={inputRef}
              type="number"
              className="h-14 text-center text-2xl font-bold"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
            />
          </div>
          <div className="text-center">
            <Label className="text-lg">Troco</Label>
            <p className="text-4xl font-bold text-green-500">
              R$ {change > 0 ? change.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={change < 0}>
            Confirmar e Finalizar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
