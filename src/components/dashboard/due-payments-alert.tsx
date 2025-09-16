
'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { getFinancialTransactions } from '@/lib/storage';
import { FinancialTransaction } from '@/types';
import { isToday, parseISO } from 'date-fns';

export function DuePaymentsAlert() {
  const [dueTodayCount, setDueTodayCount] = React.useState(0);
  const [dueTodayAmount, setDueTodayAmount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const checkDuePayments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const transactions = await getFinancialTransactions();
      
      const dueToday = transactions.filter(tx => {
        if (tx.status !== 'pendente' || !tx.dueDate) {
          return false;
        }
        try {
          // Garante que a data seja interpretada corretamente como UTC para evitar problemas de fuso horário
          const dueDate = parseISO(tx.dueDate);
          return isToday(dueDate);
        } catch (e) {
          console.error(`Invalid due date format for transaction ${tx.id}:`, tx.dueDate);
          return false;
        }
      });

      const count = dueToday.length;
      const amount = dueToday.reduce((sum, tx) => sum + tx.amount, 0);

      setDueTodayCount(count);
      setDueTodayAmount(amount);
    } catch (error) {
      console.error("Failed to check due payments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkDuePayments();
    window.addEventListener('storage-change-financialTransactions', checkDuePayments);
    return () => {
      window.removeEventListener('storage-change-financialTransactions', checkDuePayments);
    };
  }, [checkDuePayments]);

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50 animate-pulse">
        <p className="text-sm text-muted-foreground">Verificando vencimentos...</p>
      </div>
    );
  }
  
  if (dueTodayCount === 0) {
    return (
       <div className="p-4 border rounded-lg bg-green-500/10 text-green-700">
         <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-bold">Nenhum pagamento vencendo hoje.</h3>
              <p className="text-sm">Todas as contas a receber estão com os vencimentos futuros.</p>
            </div>
          </div>
      </div>
    );
  }

  return (
    <Link href="/financeiro?type=contas_a_receber">
        <div className="p-4 border-l-4 border-yellow-500 bg-yellow-500/10 rounded-r-lg text-yellow-700 hover:bg-yellow-500/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <div>
                <h3 className="text-lg font-bold">Você tem {dueTodayCount} pagamento(s) vencendo hoje!</h3>
                <p className="text-sm font-semibold">
                    Total a receber hoje: R$ {dueTodayAmount.toFixed(2)}
                </p>
                </div>
            </div>
        </div>
    </Link>
  );
}
