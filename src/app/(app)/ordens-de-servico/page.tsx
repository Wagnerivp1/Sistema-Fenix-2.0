
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { MoreHorizontal, Undo2, MessageSquare, DollarSign, Printer, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { getServiceOrders, saveServiceOrders, getCustomers, getFinancialTransactions, saveFinancialTransactions, getCompanyInfo, getSettings } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import type { Customer, ServiceOrder, User, InternalNote, FinancialTransaction, CompanyInfo } from '@/types';
import { NewOrderSheet } from '@/components/service-orders/new-order-sheet';
import { ViewCommentsDialog } from '@/components/service-orders/view-comments-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { add } from 'date-fns';

const formatDate = (dateString: string | undefined) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'Data inválida';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  // Adiciona o fuso UTC para evitar problemas de timezone
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

const allStatuses: ServiceOrder['status'][] = [
  'Aberta', 
  'Em análise', 
  'Aguardando peça',
  'Aprovado',
  'Em conserto',
  'Aguardando Pagamento',
  'Finalizado', 
  'Entregue', 
  'Cancelada'
];

function ServiceOrdersComponent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [orders, setOrders] = React.useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [editingOrder, setEditingOrder] = React.useState<ServiceOrder | null>(null);
  const [commentsOrder, setCommentsOrder] = React.useState<ServiceOrder | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = React.useState(false);
  const [customerForNewOS, setCustomerForNewOS] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('ativas');
  const [searchFilter, setSearchFilter] = React.useState('');
  const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});


  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Aberta': return 'border-transparent bg-blue-500/20 text-blue-400';
        case 'Aguardando Pagamento': return 'border-transparent bg-red-500/20 text-red-400';
        case 'Aguardando peça': return 'border-transparent bg-yellow-500/20 text-yellow-400';
        case 'Em análise': return 'border-transparent bg-cyan-500/20 text-cyan-400';
        case 'Aprovado': return 'border-transparent bg-green-500/20 text-green-400';
        case 'Em conserto': return 'border-transparent bg-indigo-500/20 text-indigo-400';
        case 'Finalizado': return 'border-transparent bg-gray-500/20 text-gray-400';
        case 'Entregue': return 'border-transparent bg-purple-500/20 text-purple-400';
        case 'Aguardando': return 'border-transparent bg-orange-500/20 text-orange-400';
        default: return 'border-transparent bg-gray-700/50 text-gray-300';
    }
  }

  const calculateUnreadCounts = React.useCallback((ordersToCheck: ServiceOrder[]) => {
    const counts: Record<string, number> = {};
    for (const order of ordersToCheck) {
      const notes = Array.isArray(order.internalNotes) ? order.internalNotes : [];
      if (notes.length === 0) continue;

      const lastViewedTimestamp = localStorage.getItem(`os-last-viewed-${order.id}`);
      const lastViewedDate = lastViewedTimestamp ? new Date(lastViewedTimestamp) : new Date(0);
      
      const unread = notes.filter(note => new Date(note.date) > lastViewedDate).length;
      if (unread > 0) {
        counts[order.id] = unread;
      }
    }
    setUnreadCounts(counts);
  }, []);

  React.useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const [loadedOrders, loadedCustomers] = await Promise.all([
            getServiceOrders(),
            getCustomers()
        ]);

        const sortedOrders = loadedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setOrders(sortedOrders);
        setCustomers(loadedCustomers);
        calculateUnreadCounts(sortedOrders);
        setIsLoading(false);

        if (customerId) {
          const customer = loadedCustomers.find(c => c.id === customerId);
          if (customer) {
            handleNewOrderClick(customer);
          }
        }
    }
    loadData();
  }, [customerId, calculateUnreadCounts]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key && event.key.toLowerCase() === 'o' && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT' && !target.isContentEditable) {
          event.preventDefault();
          handleNewOrderClick();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleNewOrderClick = (customer?: Customer | null) => {
    if (customer) {
      setCustomerForNewOS(customer);
    } else {
      setCustomerForNewOS(null);
    }
    setEditingOrder(null);
    setIsSheetOpen(true);
  }
  
  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen);
    // Limpa os estados ao fechar o sheet
    if (!isOpen) {
      setCustomerForNewOS(null);
      setEditingOrder(null);
    }
  }

  const handleEditClick = (order: ServiceOrder) => {
    setEditingOrder(order);
    setCustomerForNewOS(null);
    setIsSheetOpen(true);
  }

  const handleViewCommentsClick = (order: ServiceOrder) => {
    const currentOrder = orders.find(o => o.id === order.id);
    setCommentsOrder(currentOrder || order);
    setIsCommentsDialogOpen(true);
  }

  const handleCommentsDialogClose = (orderId?: string) => {
    setIsCommentsDialogOpen(false);
    if (orderId) {
      localStorage.setItem(`os-last-viewed-${orderId}`, new Date().toISOString());
      // Recalculate counts to remove the notification immediately
      calculateUnreadCounts(orders);
    }
  }
  
  const handleCommentAdded = async (orderId: string, commentText: string) => {
    if (!currentUser) return;
    
    const commentToAdd: InternalNote = {
      user: currentUser.name,
      date: new Date().toISOString(),
      comment: commentText,
    };
    
    let updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const existingNotes = Array.isArray(o.internalNotes) ? o.internalNotes : [];
        return {
          ...o,
          internalNotes: [...existingNotes, commentToAdd],
        };
      }
      return o;
    });

    updatedOrders = updatedOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);

    // Immediately update the last-viewed timestamp for the current user
    // This prevents showing a notification for a comment they just made.
    localStorage.setItem(`os-last-viewed-${orderId}`, commentToAdd.date);
    calculateUnreadCounts(updatedOrders);
    
    // Ensure the dialog gets the fresh data
    const freshOrderData = updatedOrders.find(o => o.id === orderId);
    if (freshOrderData) {
      setCommentsOrder(freshOrderData);
    }
    
    toast({
      title: 'Comentário Adicionado!',
      description: 'A anotação foi salva na OS.',
    });
  }

  const handleSaveOrder = async (savedOrder: ServiceOrder) => {
    let updatedOrders;
    const orderExists = orders.some(o => o.id === savedOrder.id);
    const finalOrder = { ...savedOrder };

    if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
      finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
    }
    else if (finalOrder.status !== 'Entregue') {
      delete finalOrder.deliveredDate;
    }

    if (orderExists) {
        updatedOrders = orders.map(o => o.id === finalOrder.id ? finalOrder : o);
         toast({
            title: 'Ordem de Serviço Atualizada!',
            description: 'Os dados da OS foram salvos com sucesso.',
        });
    } else {
        updatedOrders = [finalOrder, ...orders];
        toast({
            title: 'Ordem de Serviço Salva!',
            description: 'A nova ordem de serviço foi registrada com sucesso.',
        });
    }
    
    const sortedOrders = updatedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await saveServiceOrders(sortedOrders);
    setOrders(sortedOrders); 
    handleSheetOpenChange(false);
  }

  const handleReopenOrder = async (orderId: string) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'Aberta' as const } : o
    );
    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);
    toast({
      title: 'Ordem de Serviço Reaberta!',
      description: `A OS #${orderId.slice(-4)} foi movida para o status "Aberta".`,
    });
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: ServiceOrder['status']) => {
    let updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );

    if (newStatus === 'Entregue') {
        updatedOrders = updatedOrders.map(o => o.id === orderId && !o.deliveredDate ? { ...o, deliveredDate: new Date().toISOString().split('T')[0] } : o);
    }

    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);
    toast({
      title: 'Status Alterado!',
      description: `A OS #${orderId.slice(-4)} foi atualizada para "${newStatus}".`,
    });
  };

  const handleAddPayment = async (order: ServiceOrder) => {
    const finalValue = order.finalValue ?? order.totalValue;

    if (!finalValue || finalValue <= 0) {
      // If no value, just finalize
      await handleQuickStatusChange(order.id, 'Finalizado');
      return;
    }

    // Create financial transaction
    const transaction: Omit<FinancialTransaction, 'id'> = {
      type: 'receita',
      description: `Recebimento OS #${order.id.slice(-4)}`,
      amount: finalValue,
      date: new Date().toISOString().split('T')[0],
      category: 'Venda de Serviço',
      paymentMethod: order.paymentMethod || 'Dinheiro',
      relatedServiceOrderId: order.id,
    };
    
    const existingTransactions = await getFinancialTransactions();
    await saveFinancialTransactions([{ ...transaction, id: `FIN-${Date.now()}` }, ...existingTransactions]);
    
    // Update OS status
    await handleQuickStatusChange(order.id, 'Finalizado');

    toast({
      title: 'Pagamento Registrado!',
      description: `Receita de R$ ${finalValue.toFixed(2)} registrada e OS finalizada.`,
    });
  };

  const handlePrint = async (documentType: 'entry' | 'quote' | 'delivery', order: ServiceOrder) => {
    const companyInfo = await getCompanyInfo();
    const customer = customers.find(c => c.name === order.customerName);

    if (!customer) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Cliente da OS não encontrado.' });
      return;
    }
    
    if (documentType === 'entry') {
      generateEntryReceiptPdf(order, customer, companyInfo);
    } else if (documentType === 'quote') {
      generateQuotePdf(order, customer, companyInfo);
    } else if (documentType === 'delivery') {
      generateDeliveryReceiptPdf(order, customer, companyInfo);
    }
  };

  const generateEntryReceiptPdf = (order: ServiceOrder, customer: Customer, companyInfo: CompanyInfo) => {
     const performGeneration = (logoImage: HTMLImageElement | null) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 20;
        let textX = margin;
        const fontColor = '#000000';
        const logoWidth = 30;
        const logoHeight = 30;
        const logoSpacing = 5;

        // Header
        if (logoImage) {
            doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY - 8, logoWidth, logoHeight);
            textX = margin + logoWidth + logoSpacing;
        }
        
        doc.setFont('helvetica');
        doc.setTextColor(fontColor);
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        if (companyInfo.name) {
            doc.text(companyInfo.name, textX, currentY);
            currentY += 8;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyInfo.address) {
            doc.text(companyInfo.address, textX, currentY);
            currentY += 4;
        }
        if (companyInfo.phone || companyInfo.emailOrSite) {
            doc.text(`Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`, textX, currentY);
        }

        const rightHeaderX = pageWidth - margin;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Recibo de Entrada de Equipamento", rightHeaderX, currentY - 8, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`OS Nº: #${order.id.slice(-4)}`, rightHeaderX, currentY - 2, { align: 'right' });
        doc.text(`Data Entrada: ${new Date(order.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`, rightHeaderX, currentY + 4, { align: 'right' });
        
        currentY = 50;
        
        const drawInfoBox = (title: string, data: { [key: string]: string }, x: number, y: number, width: number) => {
            doc.setFillColor(243, 244, 246); // light gray bg
            doc.rect(x, y, width, 7, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(title, x + 3, y + 5);
            
            const tableBody = Object.entries(data).map(([key, value]) => [key, value]);
            doc.autoTable({
                body: tableBody,
                startY: y + 7,
                theme: 'grid',
                tableWidth: width,
                margin: { left: x },
                styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
            });
            return doc.lastAutoTable.finalY;
        }

        const boxWidth = (pageWidth - margin * 2 - 5) / 2;
        
        const clientData = {
            'Nome:': customer.name,
            'Telefone:': customer.phone,
            'Documento:': customer.document || "Não informado",
        };
        
        const equipmentData = {
            'Equipamento:': typeof order.equipment === 'string' ? order.equipment : `${order.equipment.type} ${order.equipment.brand} ${order.equipment.model}`,
            'Nº Série:': order.serialNumber || 'Não informado',
            'Acessórios': order.accessories || 'Nenhum'
        }

        const clientBoxHeight = drawInfoBox('Dados do Cliente', clientData, margin, currentY, boxWidth);
        const equipmentBoxHeight = drawInfoBox('Informações do Equipamento', equipmentData, margin + boxWidth + 5, currentY, boxWidth);
        
        currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 8;

        const drawFullWidthBox = (title: string, content: string, y: number) => {
            doc.setFillColor(243, 244, 246);
            doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin + 3, y + 5);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const textLines = doc.splitTextToSize(content, pageWidth - margin * 2 - 6);
            const textHeight = doc.getTextDimensions(textLines).h;
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, y + 7, pageWidth - margin * 2, textHeight + 6, 'S');
            doc.text(textLines, margin + 3, y + 12);
            return y + textHeight + 20;
        }
        
        currentY = drawFullWidthBox('Defeito Relatado pelo Cliente', order.reportedProblem || 'Não informado.', currentY);

        currentY += 10;
        doc.setFontSize(8);
        const termsText = "Declaro que o equipamento acima foi entregue para análise e orçamento. O prazo para orçamento é de 3 dias úteis. A apresentação deste recibo é obrigatória para a retirada do equipamento.";
        const textLines = doc.splitTextToSize(termsText, pageWidth - margin * 2);
        doc.text(textLines, margin, currentY);
        currentY += (textLines.length * 4) + 20;

        doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
        currentY += 4;
        doc.setFontSize(9);
        doc.text('Assinatura do Cliente', pageWidth / 2, currentY, { align: 'center' });


        doc.output('dataurlnewwindow');
    };
    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => performGeneration(img);
      img.onerror = () => performGeneration(null);
    } else {
      performGeneration(null);
    }
  };

  const generateQuotePdf = (order: ServiceOrder, customer: Customer, companyInfo: CompanyInfo) => {
     const performGeneration = (logoImage: HTMLImageElement | null) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 20;
        let textX = margin;
        const fontColor = '#000000';
        const logoWidth = 30;
        const logoHeight = 30;
        const logoSpacing = 5;

        // Header
        if (logoImage) {
            doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY - 8, logoWidth, logoHeight);
            textX = margin + logoWidth + logoSpacing;
        }
        
        doc.setFont('helvetica');
        doc.setTextColor(fontColor);
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        if (companyInfo.name) {
            doc.text(companyInfo.name, textX, currentY);
            currentY += 8;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyInfo.address) {
            doc.text(companyInfo.address, textX, currentY);
            currentY += 4;
        }
        if (companyInfo.phone || companyInfo.emailOrSite) {
            doc.text(`Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`, textX, currentY);
        }

        const rightHeaderX = pageWidth - margin;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Orçamento de Serviço", rightHeaderX, currentY - 8, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nº: #${order.id.slice(-4)}`, rightHeaderX, currentY - 2, { align: 'right' });
        doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });
        
        currentY = 50;

        const drawInfoBox = (title: string, data: { [key: string]: string }, x: number, y: number, width: number) => {
            doc.setFillColor(243, 244, 246); // light gray bg
            doc.rect(x, y, width, 7, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(title, x + 3, y + 5);
            
            const tableBody = Object.entries(data).map(([key, value]) => [key, value]);
            doc.autoTable({
                body: tableBody,
                startY: y + 7,
                theme: 'grid',
                tableWidth: width,
                margin: { left: x },
                styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
            });
            return doc.lastAutoTable.finalY;
        }

        const boxWidth = (pageWidth - margin * 2 - 5) / 2;
        
        const clientData = {
            'Nome:': customer.name,
            'Telefone:': customer.phone,
            'Documento:': customer.document || "Não informado",
        };
        
        const equipmentData = {
            'Equipamento:': typeof order.equipment === 'string' ? order.equipment : `${order.equipment.type} ${order.equipment.brand} ${order.equipment.model}`,
            'Nº Série:': order.serialNumber || 'Não informado'
        }

        const clientBoxHeight = drawInfoBox('Dados do Cliente', clientData, margin, currentY, boxWidth);
        const equipmentBoxHeight = drawInfoBox('Informações do Equipamento', equipmentData, margin + boxWidth + 5, currentY, boxWidth);
        currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 8;
  
        const drawFullWidthBox = (title: string, content: string, y: number) => {
            doc.setFillColor(243, 244, 246);
            doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin + 3, y + 5);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const textLines = doc.splitTextToSize(content, pageWidth - margin * 2 - 6);
            const textHeight = doc.getTextDimensions(textLines).h;
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, y + 7, pageWidth - margin * 2, textHeight + 6, 'S');
            doc.text(textLines, margin + 3, y + 12);
            return y + textHeight + 20;
        }

        currentY = drawFullWidthBox('Defeito Reclamado', order.reportedProblem || 'Não informado.', currentY);
        currentY = drawFullWidthBox('Diagnóstico / Laudo Técnico', order.technicalReport || 'Aguardando diagnóstico técnico.', currentY);

        if (order.items && order.items.length > 0) {
            doc.autoTable({
                startY: currentY,
                head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
                body: order.items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
                theme: 'striped',
                headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
                bodyStyles: { fontSize: 8, cellPadding: 1.5 },
                footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' },
                foot: [
                    ['Total', '', '', '', `R$ ${order.totalValue.toFixed(2)}`]
                ],
                margin: { left: margin, right: margin }
            });
            currentY = doc.lastAutoTable.finalY + 10;
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Validade e Condições:", margin, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Este orçamento é válido por até 3 dias. A execução dos serviços ocorrerá somente após aprovação do cliente.", margin, currentY);
        
        doc.output('dataurlnewwindow');
    };
    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => performGeneration(img);
      img.onerror = () => performGeneration(null);
    } else {
      performGeneration(null);
    }
  };

  const generateDeliveryReceiptPdf = (order: ServiceOrder, customer: Customer, companyInfo: CompanyInfo) => {
    const performGeneration = async (logoImage: HTMLImageElement | null) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let currentY = 20;
      let textX = margin;
      const fontColor = '#000000';
  
      // Header
      if (logoImage) {
        const logoWidth = 30;
        const logoHeight = 30;
        doc.addImage(logoImage, 'PNG', margin, currentY - 5, logoWidth, logoHeight);
        textX = margin + logoWidth + 5;
      }
  
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(companyInfo.name || 'Sua Empresa', textX, currentY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (companyInfo.address) {
        doc.text(companyInfo.address, textX, currentY + 5);
      }
      if (companyInfo.phone || companyInfo.emailOrSite) {
        doc.text(
          `Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`,
          textX,
          currentY + 10
        );
      }
  
      // Right side header
      const rightHeaderX = pageWidth - margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Recibo de Entrega', rightHeaderX, currentY, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`OS Nº: ${order.id.slice(-4)}`, rightHeaderX, currentY + 5, { align: 'right' });
      doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 10, { align: 'right' });
  
      currentY += 25;
      
      const drawInfoBox = (title: string, data: { [key: string]: string }, x: number, y: number, width: number) => {
          doc.setFillColor(243, 244, 246); // light gray bg
          doc.rect(x, y, width, 7, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(title, x + 3, y + 5);
          
          const tableBody = Object.entries(data).map(([key, value]) => [key, value]);
          doc.autoTable({
              body: tableBody,
              startY: y + 7,
              theme: 'grid',
              tableWidth: width,
              margin: { left: x },
              styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
              columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
          });
          return doc.lastAutoTable.finalY;
      }

      const boxWidth = (pageWidth - margin * 2 - 5) / 2;
      
      const clientData = {
          'Nome:': customer.name,
          'Telefone:': customer.phone,
          'Documento:': customer.document || 'Não informado',
      };
      
      const equipmentData = {
          'Equipamento:': typeof order.equipment === 'string' ? order.equipment : `${order.equipment.type} ${order.equipment.brand} ${order.equipment.model}`,
          'Nº Série:': order.serialNumber || 'Não informado'
      }

      const clientBoxHeight = drawInfoBox('Dados do Cliente', clientData, margin, currentY, boxWidth);
      const equipmentBoxHeight = drawInfoBox('Informações do Equipamento', equipmentData, margin + boxWidth + 5, currentY, boxWidth);
      
      currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 8;
  
      const drawFullWidthBox = (title: string, content: string, y: number) => {
          doc.setFillColor(243, 244, 246);
          doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(title, margin + 3, y + 5);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const textLines = doc.splitTextToSize(content, pageWidth - margin * 2 - 6);
          const textHeight = doc.getTextDimensions(textLines).h;
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, y + 7, pageWidth - margin * 2, textHeight + 6, 'S');
          doc.text(textLines, margin + 3, y + 12);
          return y + textHeight + 20;
      }
      
      currentY = drawFullWidthBox('Resumo dos Serviços/Peças', order.technicalReport || 'Nenhum serviço detalhado.', currentY);

      doc.setFont('helvetica', 'bold');
      doc.text('Termo de Recebimento:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 5;
      const receiptDate = order.deliveredDate ? new Date(`${order.deliveredDate}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : new Date().toLocaleDateString('pt-BR');
      doc.text(`Declaro que recebi o equipamento descrito acima, devidamente reparado e em funcionamento, na data de ${receiptDate}.`, margin, currentY);
      currentY += 15;
      
      // Termo de Garantia
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Termo de Garantia', margin + 3, currentY + 5);
      
      currentY += 7;
      const warrantyContent = [
        '1. Prazo: Conforme o Art. 26, II do CDC, o prazo de garantia legal para os serviços prestados e peças novas é de 90 dias a contar da data de entrega do equipamento.',
        '2. Cobertura: A garantia cobre defeitos de fabricação das peças substituídas e falhas no serviço executado que estejam diretamente relacionadas ao reparo descrito nesta OS.',
        '3. Exclusões: A garantia não cobre danos por mau uso, negligência, acidentes (quedas, líquidos), picos de energia, instalação de softwares maliciosos (vírus), modificações não autorizadas, violação de lacres ou reparos por terceiros. Problemas de software não relacionados ao serviço executado não são cobertos.',
        '4. Procedimento: Para acionar a garantia, apresente esta OS. O equipamento passará por nova análise técnica para constatar se o defeito é coberto pela garantia.'
      ];
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const warrantyLines = doc.splitTextToSize(warrantyContent.join('\n\n'), pageWidth - margin * 2 - 6);
      const warrantyHeight = doc.getTextDimensions(warrantyLines).h;
      
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, currentY, pageWidth - margin * 2, warrantyHeight + 6, 'S');
      doc.text(warrantyLines, margin + 3, currentY + 5);
      
      doc.output('dataurlnewwindow');
    };
  
    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => performGeneration(img);
      img.onerror = () => performGeneration(null);
    } else {
      performGeneration(null);
    }
  };

  const filteredOrders = React.useMemo(() => {
    let result = [...orders];

    if (statusFilter === 'ativas') {
      result = result.filter(o => o.status !== 'Finalizado' && o.status !== 'Entregue' && o.status !== 'Cancelada');
    } else if (statusFilter === 'finalizadas') {
      result = result.filter(o => o.status === 'Finalizado' || o.status === 'Entregue');
    } else if (statusFilter !== 'todas') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (searchFilter) {
      const lowerCaseFilter = searchFilter.toLowerCase();
      result = result.filter(o => {
        const equipmentName = typeof o.equipment === 'string' 
          ? o.equipment.toLowerCase() 
          : `${o.equipment?.type || ''} ${o.equipment?.brand || ''} ${o.equipment?.model || ''}`.trim().toLowerCase();
          
        return (o.customerName && o.customerName.toLowerCase().includes(lowerCaseFilter)) ||
               (equipmentName.includes(lowerCaseFilter)) ||
               (o.id && o.id.toLowerCase().includes(lowerCaseFilter));
      });
    }

    return result;
  }, [orders, statusFilter, searchFilter]);

  if (isLoading) {
    return <div>Carregando ordens de serviço...</div>;
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Ordens de Serviço</CardTitle>
            <CardDescription>
              Gerencie as ordens de serviço.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-auto">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Visualizações Gerais</SelectLabel>
                  <SelectItem value="ativas">Status: Ativas</SelectItem>
                  <SelectItem value="finalizadas">Status: Finalizadas</SelectItem>
                  <SelectItem value="todas">Status: Todas</SelectItem>
                </SelectGroup>
                 <SelectGroup>
                  <SelectLabel>Status Específicos</SelectLabel>
                   {allStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <NewOrderSheet 
              onNewOrderClick={handleNewOrderClick}
              customer={customerForNewOS}
              serviceOrder={editingOrder}
              isOpen={isSheetOpen}
              onOpenChange={handleSheetOpenChange}
              onSave={handleSaveOrder}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
         <div className="mb-4">
          <Input
            placeholder="Filtrar por cliente, equipamento ou nº OS..."
            className="max-w-sm"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead className="hidden md:table-cell">Data de Entrada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const equipmentName = typeof order.equipment === 'string'
                  ? order.equipment
                  : `${order.equipment.type || ''} ${order.equipment.brand || ''} ${order.equipment.model || ''}`.trim();
                return (
                  <TableRow key={order.id}>
                    <TableCell className="hidden sm:table-cell">
                       <Link href="#" className="font-medium text-primary hover:underline" onClick={(e) => { e.preventDefault(); handleEditClick(order); }}>
                        #{order.id.slice(-4)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>{equipmentName}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(order.date)}</TableCell>
                    <TableCell>
                      <div className="relative inline-flex items-center">
                        <Badge className={cn('font-semibold', getStatusVariant(order.status))} variant="outline">
                          {order.status}
                        </Badge>
                        {unreadCounts[order.id] > 0 && (
                          <div className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCounts[order.id]}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEditClick(order)}>Editar Detalhes</DropdownMenuItem>
                           <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Mudar Status</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup 
                                        value={order.status} 
                                        onValueChange={(value) => handleQuickStatusChange(order.id, value as ServiceOrder['status'])}
                                    >
                                        {allStatuses.map(s => (
                                            <DropdownMenuRadioItem key={s} value={s}>{s}</DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                           <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                               <Printer className="mr-2 h-4 w-4" />
                               Imprimir
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onSelect={() => handlePrint('entry', order)}>Recibo de Entrada</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handlePrint('quote', order)}>Orçamento de Serviço</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handlePrint('delivery', order)}>Recibo de Entrega</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem onSelect={() => handleViewCommentsClick(order)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Exibir Comentários
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === 'Aguardando Pagamento' && (
                            <DropdownMenuItem onSelect={() => handleAddPayment(order)}>
                              <DollarSign className="mr-2 h-4 w-4 text-green-500"/>
                              Adicionar Pagamento
                            </DropdownMenuItem>
                          )}
                          {(order.status === 'Finalizado' || order.status === 'Entregue' || order.status === 'Cancelada') && (
                            <DropdownMenuItem onSelect={() => handleReopenOrder(order.id)}>
                              <Undo2 className="mr-2 h-4 w-4" />
                              Reabrir OS
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma ordem de serviço encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <ViewCommentsDialog 
      isOpen={isCommentsDialogOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCommentsDialogClose(commentsOrder?.id);
        } else {
          setIsCommentsDialogOpen(true);
        }
      }}
      serviceOrder={commentsOrder}
      onCommentAdd={handleCommentAdded}
    />
    </>
  );
}

export default function ServiceOrdersPage() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <ServiceOrdersComponent />
    </React.Suspense>
  );
}
