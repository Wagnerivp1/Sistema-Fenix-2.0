
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { AlertsAndNotifications } from '@/components/dashboard/alerts-and-notifications';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { FinancialTransaction } from '@/types';
import { getFinancialTransactions, saveFinancialTransactions, getCompanyInfo } from '@/lib/storage';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = React.useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  
  const formatDateForDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const generateReceiptPdf = async (transaction: FinancialTransaction) => {
    const companyInfo = await getCompanyInfo();

    const generateContent = (logoImage: HTMLImageElement | null = null) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const fontColor = '#000000';
      let currentY = 12;

      // Header
      if (logoImage) {
        doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY, 25, 25);
      }
      const companyInfoX = margin + (logoImage ? 30 : 0);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(fontColor);
      doc.setFontSize(16);
      doc.text(companyInfo.name || "Recibo", companyInfoX, currentY + 10);
      
      const title = transaction.type === 'receita' ? 'Recibo de Receita' : 'Comprovante de Despesa';
      doc.setFontSize(20);
      doc.text(title, pageWidth / 2, currentY + 30, { align: 'center' });
      currentY += 45;

      // Body
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pelo presente, declaramos ter ${transaction.type === 'receita' ? 'recebido' : 'pago'} a quantia de:`, margin, currentY);
      currentY += 10;
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${transaction.amount.toFixed(2)}`, margin, currentY);
      currentY += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Referente a: ${transaction.description}`, margin, currentY);
      currentY += 15;

      // Details
      doc.autoTable({
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 10 },
        body: [
          [{content: 'Data:', styles: {fontStyle: 'bold'}}, formatDateForDisplay(transaction.date)],
          [{content: 'Forma de Pag.:', styles: {fontStyle: 'bold'}}, transaction.paymentMethod],
          [{content: 'Categoria:', styles: {fontStyle: 'bold'}}, transaction.category],
        ],
        columnStyles: { 0: { cellWidth: 35 } },
      });
      currentY = doc.lastAutoTable.finalY + 30;

      // Signature
      const city = companyInfo.address?.split('-')[0]?.split(',')[1]?.trim() || "___________________";
      doc.text(`${city}, ${new Date().toLocaleDateString('pt-BR')}.`, pageWidth / 2, currentY, { align: 'center'});
      currentY += 20;

      doc.line(margin + 40, currentY, pageWidth - margin - 40, currentY);
      doc.text(companyInfo.name || 'Assinatura', pageWidth / 2, currentY + 5, { align: 'center'});
      
      doc.autoPrint();
      doc.output('dataurlnewwindow');
    };
    
    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.onload = () => generateContent(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        generateContent();
      };
    } else {
      generateContent();
    }
  };


  const handleNewSale = () => {
    router.push('/vendas');
  };
  
  const handleAddTransaction = async (transaction: Omit<FinancialTransaction, 'id'>, printReceipt: boolean) => {
    const existingTransactions = await getFinancialTransactions();
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: `FIN-${Date.now()}`
    };
    await saveFinancialTransactions([newTransaction, ...existingTransactions]);
    toast({
      title: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} adicionada!`,
      description: `O lançamento de R$ ${transaction.amount.toFixed(2)} foi salvo.`
    });
    setIsIncomeDialogOpen(false);
    setIsExpenseDialogOpen(false);
    
    if (printReceipt) {
        await generateReceiptPdf(newTransaction);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key.toUpperCase();

      if (event.key === 'F2') {
        event.preventDefault();
        handleNewSale();
      } else if (event.shiftKey && key === 'R') {
        event.preventDefault();
        setIsIncomeDialogOpen(true);
      } else if (event.shiftKey && key === 'D') {
        event.preventDefault();
        setIsExpenseDialogOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast, router]);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do seu negócio em tempo real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleNewSale}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
              <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                F2
              </kbd>
            </Button>
            <Button variant="outline" onClick={() => setIsIncomeDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Receita
              <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Shift+R
              </kbd>
            </Button>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
              <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Shift+D
              </kbd>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCards />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-8">
          <div className="lg:col-span-2">
            <RecentOrdersTable />
          </div>
          <div className="lg:col-span-1">
            <AlertsAndNotifications />
          </div>
        </div>
      </div>
      
      <AddTransactionDialog
        isOpen={isIncomeDialogOpen}
        onOpenChange={setIsIncomeDialogOpen}
        type="receita"
        onSave={handleAddTransaction}
      />
      
      <AddTransactionDialog
        isOpen={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        type="despesa"
        onSave={handleAddTransaction}
      />
    </>
  );
}
