
'use client';

import * as React from 'react';
import { PlusCircle, Printer, FileText, Trash2, X, ChevronsUpDown, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCustomers, getStock, getCompanyInfo } from '@/lib/storage';
import type { Customer, ServiceOrder, StockItem, CompanyInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { add } from 'date-fns';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}


interface NewOrderSheetProps {
  onNewOrderClick: (customer?: Customer | null) => void;
  customer?: Customer | null;
  serviceOrder?: ServiceOrder | null;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onSave?: (serviceOrder: ServiceOrder) => void;
}

interface QuoteItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  type: 'service' | 'part';
}

const SETTINGS_KEY = 'app_settings';

export function NewOrderSheet({ onNewOrderClick, customer, serviceOrder, isOpen, onOpenChange, onSave }: NewOrderSheetProps) {
  const { toast } = useToast();
  
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [reportedProblem, setReportedProblem] = React.useState('');
  const [equipmentType, setEquipmentType] = React.useState('');
  const [equipment, setEquipment] = React.useState({ brand: '', model: '', serial: '' });
  const [accessories, setAccessories] = React.useState('');
  const [technicalReport, setTechnicalReport] = React.useState('');
  const [internalNotes, setInternalNotes] = React.useState('');
  const [items, setItems] = React.useState<QuoteItem[]>([]);
  const [status, setStatus] = React.useState<ServiceOrder['status']>('Aberta');
  const [warranty, setWarranty] = React.useState('');
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = React.useState(false);
  const [isManualAddDialogOpen, setIsManualAddDialogOpen] = React.useState(false);
  const [manualAddItem, setManualAddItem] = React.useState<QuoteItem | null>(null);

  const [newItem, setNewItem] = React.useState({ description: '', quantity: 1, unitPrice: 0, type: 'service' as 'service' | 'part' });
  const [openCombobox, setOpenCombobox] = React.useState(false);

  const isEditing = !!serviceOrder;
  
  React.useEffect(() => {
    // Carrega clientes e estoque uma vez
    setCustomers(getCustomers());
    setStock(getStock());
  }, []);

  React.useEffect(() => {
    let defaultWarrantyDays = 90;
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        defaultWarrantyDays = JSON.parse(savedSettings).defaultWarrantyDays || 90;
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
    const defaultWarranty = `${defaultWarrantyDays} dias`;

    if (isOpen) { 
      if (isEditing && serviceOrder) {
          const selectedCustomer = customers.find(c => c.name === serviceOrder.customerName);
          setSelectedCustomerId(selectedCustomer?.id || '');
          const [type, brand, ...modelParts] = serviceOrder.equipment.split(' ');
          const model = modelParts.join(' ');
          setEquipmentType(type || '');
          setEquipment({
              brand: brand || '',
              model: model || '',
              serial: serviceOrder.serialNumber || '',
          });
          setAccessories(serviceOrder.accessories || ''); 
          setReportedProblem(serviceOrder.reportedProblem || '');
          setTechnicalReport(serviceOrder.technicalReport || ''); 
          setItems(serviceOrder.items || []); 
          setStatus(serviceOrder.status);
          setInternalNotes(serviceOrder.internalNotes || '');
          setWarranty(serviceOrder.warranty || defaultWarranty);
      } else if (customer) {
          setSelectedCustomerId(customer.id);
          setEquipmentType('');
          setEquipment({ brand: '', model: '', serial: '' });
          setAccessories('');
          setReportedProblem('');
          setTechnicalReport('');
          setItems([]);
          setStatus('Aberta');
          setInternalNotes('');
          setWarranty(defaultWarranty);
      } else {
          // Reset form for a new blank OS
          setSelectedCustomerId('');
          setEquipmentType('');
          setEquipment({ brand: '', model: '', serial: '' });
          setAccessories('');
          setReportedProblem('');
          setTechnicalReport('');
          setItems([]);
          setStatus('Aberta');
          setInternalNotes('');
          setWarranty(defaultWarranty);
      }
    }
  }, [serviceOrder, customer, isEditing, isOpen, customers]);


  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEquipment(prev => ({ ...prev, [id]: value }));
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Item inválido',
        description: 'Preencha a descrição e a quantidade do item.',
      });
      return;
    }

    if (newItem.type === 'part') {
      const stockItem = stock.find(item => item.name.toLowerCase() === newItem.description.toLowerCase());
      if (!stockItem) {
        setManualAddItem({ ...newItem, id: Date.now() });
        setIsManualAddDialogOpen(true);
        return;
      }
    }

    setItems([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service' }); // Reset for next item
  };

  const confirmManualAdd = () => {
    if (manualAddItem) {
      setItems([...items, manualAddItem]);
    }
    setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service' });
    setIsManualAddDialogOpen(false);
    setManualAddItem(null);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const calculateTotal = (type?: 'service' | 'part') => {
    const filteredItems = type ? items.filter(item => item.type === type) : items;
    return filteredItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  };
  
  const getFinalOrderData = () => {
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, selecione um cliente.' });
      return null;
    }

    const fullEquipmentName = `${equipmentType} ${equipment.brand} ${equipment.model}`.trim();
    if (!fullEquipmentName) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, preencha as informações do equipamento.' });
        return null;
    }

    const finalOrder: ServiceOrder = {
        id: serviceOrder?.id || `OS-${Date.now()}`,
        customerName: selectedCustomer.name,
        equipment: fullEquipmentName,
        reportedProblem: reportedProblem,
        status: status,
        date: serviceOrder?.date || new Date().toISOString().split('T')[0],
        totalValue: calculateTotal(),
        items: items,
        internalNotes: internalNotes,
        technicalReport: technicalReport,
        accessories: accessories,
        serialNumber: equipment.serial,
        warranty: warranty,
        attendant: 'Admin', // Placeholder for now
    };

    // If status is 'Entregue' and no deliveredDate, set it
    if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
      finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
    }
    // If status is not 'Entregue', clear the deliveredDate
    else if (finalOrder.status !== 'Entregue') {
      delete finalOrder.deliveredDate;
    }
    
    return finalOrder;
  }
  
  const handleSave = () => {
    const finalOrder = getFinalOrderData();
    if (finalOrder && onSave) {
        onSave(finalOrder);
    }
  };

  const generateQuotePdf = () => {
    const companyInfo = getCompanyInfo();
    const orderData = getFinalOrderData();

    if (!orderData) {
        toast({ variant: 'destructive', title: 'Dados Incompletos', description: 'Preencha os dados do cliente e equipamento.' });
        return;
    }

    const performPdfGeneration = (logoImage: HTMLImageElement | null) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 12;
        const fontColor = '#000000';
        const primaryColor = '#e0e7ff';
        const secondaryColor = '#f3f4f6';

        // Header
        if (logoImage) {
            const logoAR = logoImage.width / logoImage.height;
            doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, currentY, 20 * logoAR, 20);
        }
        
        const companyInfoX = margin + (logoImage ? 25 : 0);
        doc.setFont('helvetica');
        doc.setTextColor(fontColor);
        
        if (companyInfo.name) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(companyInfo.name, companyInfoX, currentY + 6);
        }
        if (companyInfo.address) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(companyInfo.address, companyInfoX, currentY + 12);
        }
        if (companyInfo.phone || companyInfo.emailOrSite) {
            doc.text(`Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`, companyInfoX, currentY + 17);
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Orçamento de Serviço", pageWidth - margin, currentY + 6, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nº: #${orderData.id.slice(-4)}`, pageWidth - margin, currentY + 12, { align: 'right' });
        doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, currentY + 17, { align: 'right' });

        currentY = 40;

        // Content
        const drawBoxWithTitle = (title: string, x: number, y: number, width: number, minHeight: number, text: string | string[]) => {
          const textArray = Array.isArray(text) ? text : [text];
          const textHeight = doc.getTextDimensions(textArray).h;
          const boxHeight = Math.max(minHeight, textHeight + 4);
          
          doc.setFillColor(primaryColor);
          doc.rect(x, y, width, 6, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(fontColor);
          doc.text(title, x + 2, y + 4.5);
          
          doc.setDrawColor(primaryColor);
          doc.rect(x, y + 6, width, boxHeight, 'S');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(fontColor);
          doc.text(textArray, x + 2, y + 10);

          return y + boxHeight + 8;
        };

        const boxWidth = (pageWidth - (margin * 2));
        
        const customer = customers.find(c => c.id === selectedCustomerId);
        const customerInfo = [
          `Nome: ${customer?.name}`,
          `Telefone: ${customer?.phone}`,
          `Endereço: ${customer?.address || 'Não informado'}`,
        ];
        currentY = drawBoxWithTitle('Dados do Cliente', margin, currentY, boxWidth, 15, customerInfo);

        const equipmentInfo = [
          `Equipamento: ${orderData.equipment}`,
          `Nº Série: ${orderData.serialNumber || 'Não informado'}`,
          `Acessórios: ${orderData.accessories || 'Nenhum'}`,
        ];
        currentY = drawBoxWithTitle('Informações do Equipamento', margin, currentY, boxWidth, 15, equipmentInfo);
        
        const problemText = doc.splitTextToSize(orderData.reportedProblem || "Não informado", boxWidth - 4);
        currentY = drawBoxWithTitle('Defeito Reclamado', margin, currentY, boxWidth, 15, problemText);

        const servicesText = doc.splitTextToSize(orderData.technicalReport || 'Aguardando diagnóstico técnico.', boxWidth - 4);
        currentY = drawBoxWithTitle('Diagnóstico / Laudo Técnico', margin, currentY, boxWidth, 20, servicesText);

        if (orderData.items && orderData.items.length > 0) {
          doc.autoTable({
            startY: currentY,
            head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
            body: orderData.items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: fontColor, fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
            bodyStyles: { fontSize: 8, cellPadding: 1.5 },
            footStyles: { fillColor: secondaryColor, textColor: fontColor },
            margin: { left: margin, right: margin }
          });
          currentY = doc.lastAutoTable.finalY;
        }
        
        currentY += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(fontColor);
        doc.text(`Valor Total: R$ ${orderData.totalValue.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 6;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(fontColor);
        doc.text('Validade e Condições:', margin, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        currentY += 3;
        const warrantyText = "Este orçamento é válido por até 3 dias. A execução dos serviços ocorrerá somente após aprovação do cliente. Peças e serviços podem ser alterados após análise técnica.";
        doc.text(doc.splitTextToSize(warrantyText, pageWidth - (margin * 2)), margin, currentY);
        currentY += 12;
        
        doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
        currentY += 4;
        doc.setFontSize(9);
        doc.setTextColor(fontColor);
        doc.text('Assinatura do Cliente (Aprovação)', pageWidth / 2, currentY, { align: 'center'});

        doc.output('dataurlnewwindow');
    };

    if (companyInfo?.logoUrl) {
        const img = new Image();
        img.src = companyInfo.logoUrl;
        img.crossOrigin = 'anonymous'; // Important for data URIs
        img.onload = () => performPdfGeneration(img);
        img.onerror = () => {
            console.error("Error loading logo, proceeding without it.");
            performPdfGeneration(null);
        };
    } else {
        performPdfGeneration(null);
    }
  };

  const getWarrantyPeriodText = (order: ServiceOrder) => {
    if (order.status !== 'Entregue' || !order.deliveredDate || !order.warranty || order.warranty.toLowerCase().includes('sem garantia')) {
        return "Garantia não aplicável ou pendente.";
    }

    let defaultWarrantyDays = 90;
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            defaultWarrantyDays = JSON.parse(savedSettings).defaultWarrantyDays || 90;
        }
    } catch (e) { /* ignore */ }

    const match = order.warranty.match(/(\d+)\s*(dias|meses|mes|ano|anos)/i);
    let duration: Duration = { days: defaultWarrantyDays };

    if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('dia')) duration = { days: value };
        else if (unit.startsWith('mes')) duration = { months: value };
        else if (unit.startsWith('ano')) duration = { years: value };
    }

    const [year, month, day] = order.deliveredDate.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = add(startDate, duration);
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    return `Período da Garantia: de ${formatDate(startDate)} até ${formatDate(endDate)}.`;
};

  const generateDeliveryReceiptPdf = () => {
    const orderToPrint = getFinalOrderData();
    if (!orderToPrint || !orderToPrint.deliveredDate) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A OS precisa estar com status "Entregue" e ter uma data de entrega.' });
      return;
    }
    
    const companyInfo = getCompanyInfo();
    
    const performGeneration = (logoImage: HTMLImageElement | null) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        const halfPage = pageHeight / 2;
        
        const drawReceiptContent = (yOffset: number, via: string) => {
            let localY = yOffset;
            const osId = `#${orderToPrint.id.slice(-4)}`;
            const customer = customers.find(c => c.name === orderToPrint.customerName);

            if (!customer) return;

            // Header
            if (logoImage) {
                doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, localY, 15, 15);
            }
            const companyInfoX = margin + (logoImage ? 20 : 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(companyInfo.name || "", companyInfoX, localY + 4);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(companyInfo.address || "", companyInfoX, localY + 8);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Recibo de Entrega', pageWidth - margin, localY + 4, { align: 'right' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`OS: ${osId}`, pageWidth - margin, localY + 9, { align: 'right' });
            
            localY += 18;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(via, pageWidth / 2, localY, { align: 'center' });
            localY += 7;

            // Content
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', margin, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(customer.name, margin + 15, localY);
            doc.setFont('helvetica', 'bold');
            doc.text('Data Entrega:', margin + 120, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date(orderToPrint.deliveredDate!).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), margin + 143, localY);
            localY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Equipamento:', margin, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(orderToPrint.equipment, margin + 22, localY);
            localY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Garantia:', margin, localY);
            doc.setFont('helvetica', 'normal');
            const warrantyText = getWarrantyPeriodText(orderToPrint);
            const warrantyLines = doc.splitTextToSize(warrantyText, pageWidth - margin * 2 - 17);
            doc.text(warrantyLines, margin + 17, localY);
            localY += (warrantyLines.length * 4) + 10;

            const termsText = `Confirmo a retirada do equipamento acima descrito, nas condições em que se encontra, após a realização do serviço de manutenção.`;
            doc.setFontSize(8);
            doc.text(doc.splitTextToSize(termsText, pageWidth - margin * 2), margin, localY);
            localY += 20;

            // Signature
            doc.line(margin + 30, localY, pageWidth - margin - 30, localY);
            localY += 4;
            doc.setFontSize(9);
            doc.text('Assinatura do Cliente', pageWidth / 2, localY, { align: 'center' });
        };
        
        // Via Cliente
        drawReceiptContent(10, "Via do Cliente");
        
        // Cut line
        doc.setLineDashPattern([2, 1], 0);
        doc.line(margin, halfPage, pageWidth - margin, halfPage);
        doc.setLineDashPattern([], 0);
        
        // Via Loja
        drawReceiptContent(halfPage + 10, "Via da Loja");
        
        doc.output('dataurlnewwindow');
    };

    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => performGeneration(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        performGeneration(null);
      };
    } else {
      performGeneration(null);
    }
  };

  const generateEntryReceiptPdf = () => {
    const orderToPrint = getFinalOrderData();
    if (!orderToPrint) {
      toast({ variant: 'destructive', title: 'Dados Incompletos', description: 'Preencha os dados do cliente e equipamento.' });
      return;
    }
    
    const companyInfo = getCompanyInfo();

    const performGeneration = (logoImage: HTMLImageElement | null) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        const halfPage = pageHeight / 2;

        const drawReceiptContent = (yOffset: number, via: string) => {
            let localY = yOffset;
            const osId = `#${orderToPrint.id.slice(-4)}`;
            const customer = customers.find(c => c.name === orderToPrint.customerName);
            if (!customer) return;

            // Header
            if (logoImage) {
                const logoAR = logoImage.width / logoImage.height;
                doc.addImage(logoImage, logoImage.src.endsWith('png') ? 'PNG' : 'JPEG', margin, localY, 15 * logoAR, 15);
            }
            const companyInfoX = margin + (logoImage ? 20 : 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(companyInfo.name || "Sua Empresa", companyInfoX, localY + 4);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(companyInfo.address || "", companyInfoX, localY + 8);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Recibo de Entrada', pageWidth - margin, localY + 4, { align: 'right' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`OS: ${osId}`, pageWidth - margin, localY + 9, { align: 'right' });
            localY += 18;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(via, pageWidth / 2, localY, { align: 'center' });
            localY += 7;

            // Content
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Data Entrada:', margin, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date(orderToPrint.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}), margin + 25, localY);
            localY += 5;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', margin, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(customer.name, margin + 15, localY);
            localY += 5;

            doc.setFont('helvetica', 'bold');
            doc.text('Equipamento:', margin, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(orderToPrint.equipment, margin + 22, localY);
            localY += 5;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Defeito Relatado:', margin, localY);
            doc.setFont('helvetica', 'normal');
            const problemLines = doc.splitTextToSize(orderToPrint.reportedProblem, pageWidth - margin * 2 - 30);
            doc.text(problemLines, margin + 30, localY);
            localY += (problemLines.length * 4) + 2;

            doc.setFont('helvetica', 'bold');
            doc.text('Acessórios:', margin, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(orderToPrint.accessories || 'Nenhum', margin + 20, localY);
            localY += 10;

            const termsText = "Declaro que o equipamento acima foi entregue para análise e orçamento. O prazo para orçamento é de 3 dias úteis. A garantia do serviço é de 90 dias, cobrindo apenas o defeito reparado.";
            doc.setFontSize(7);
            doc.text(doc.splitTextToSize(termsText, pageWidth - margin * 2), margin, localY);
            localY += 20;

            // Signature
            doc.line(margin + 30, localY, pageWidth - margin - 30, localY);
            localY += 4;
            doc.setFontSize(9);
            doc.text('Assinatura do Cliente', pageWidth / 2, localY, { align: 'center' });
        };

        // Via Cliente
        drawReceiptContent(10, "Via do Cliente");
        
        // Cut line
        doc.setLineDashPattern([2, 1], 0);
        doc.line(margin, halfPage, pageWidth - margin, halfPage);
        doc.setLineDashPattern([], 0);
        
        // Via Loja
        drawReceiptContent(halfPage + 10, "Via da Loja");
        
        doc.output('dataurlnewwindow');
    };

    if (companyInfo?.logoUrl) {
      const img = new Image();
      img.src = companyInfo.logoUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => performGeneration(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        performGeneration(null);
      };
    } else {
      performGeneration(null);
    }
  };


  const handlePrint = (documentType: string) => {
    switch (documentType) {
      case 'Recibo de Entrada':
        generateEntryReceiptPdf();
        break;
      case 'Orçamento':
        generateQuotePdf();
        break;
      case 'Recibo de Entrega':
        generateDeliveryReceiptPdf();
        break;
      default:
        toast({
            title: 'Imprimindo documento...',
            description: `O ${documentType} será impresso.`,
        });
        break;
    }
  }

  const handleStatusChange = (value: ServiceOrder['status'] | 'Finalizar') => {
    if (value === 'Finalizar') {
      setIsFinalizeDialogOpen(true);
    } else {
      setStatus(value as ServiceOrder['status']);
    }
  };

  const handleFinalize = (paid: boolean) => {
    if (paid) {
      setStatus('Finalizado');
    } else {
      setStatus('Aguardando Pagamento');
    }
    setIsFinalizeDialogOpen(false);
  };

  const trigger = (
    <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onNewOrderClick()}>
      <PlusCircle className="h-3.5 w-3.5" />
      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
        Adicionar OS
      </span>
        <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
          O
        </kbd>
    </Button>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {onOpenChange && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!onOpenChange && trigger}
      <DialogContent className="sm:max-w-4xl w-full h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-4 flex-shrink-0 border-b">
          <DialogTitle>{isEditing ? `Editar Ordem de Serviço #${serviceOrder?.id.slice(-4)}` : 'Nova Ordem de Serviço'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Altere os dados do atendimento, adicione serviços e peças.` : 'Preencha os dados para registrar um novo atendimento.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow min-h-0">
            <Tabs defaultValue="general" className="h-full flex flex-col">
                <div className="px-4 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                      <TabsTrigger value="items">Serviços e Peças</TabsTrigger>
                      <TabsTrigger value="notes">Comentários</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-grow min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 pt-2 space-y-3">
                      <TabsContent value="general" className="mt-0 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Label htmlFor="customer">Cliente</Label>
                                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Aberta">Aberta</SelectItem>
                                  <SelectItem value="Em análise">Em análise</SelectItem>
                                  <SelectItem value="Aguardando peça">Aguardando peça</SelectItem>
                                  <SelectItem value="Aguardando Pagamento">Aguardando Pagamento</SelectItem>
                                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                                  <SelectItem value="Em conserto">Em conserto</SelectItem>
                                  <SelectItem value="Finalizar">Finalizar</SelectItem>
                                  <SelectItem value="Entregue">Entregue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <Label htmlFor="type">Tipo</Label>
                              <Input id="type" placeholder="Ex: Notebook" value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} />
                            </div>
                            <div>
                              <Label htmlFor="brand">Marca</Label>
                              <Input id="brand" placeholder="Ex: Dell" value={equipment.brand} onChange={handleEquipmentChange} />
                            </div>
                            <div>
                              <Label htmlFor="model">Modelo</Label>
                              <Input id="model" placeholder="Ex: Inspiron 15" value={equipment.model} onChange={handleEquipmentChange} />
                            </div>
                            <div>
                              <Label htmlFor="serial">Nº de Série</Label>
                              <Input id="serial" placeholder="Serial" value={equipment.serial} onChange={handleEquipmentChange} />
                            </div>
                          </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="reported_problem">Defeito Reclamado</Label>
                                <Textarea
                                  id="reported_problem"
                                  placeholder="Descrição do problema relatado pelo cliente."
                                  value={reportedProblem}
                                  onChange={(e) => setReportedProblem(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="accessories">Acessórios Entregues</Label>
                                <Textarea
                                  id="accessories"
                                  placeholder="Ex: Carregador original, mochila preta e adaptador HDMI."
                                  value={accessories}
                                  onChange={(e) => setAccessories(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1.5">
                                    <Label htmlFor="warranty">Garantia Aplicada</Label>
                                    <Input 
                                        id="warranty" 
                                        placeholder="Ex: 90 dias"
                                        value={warranty}
                                        onChange={(e) => setWarranty(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Exemplos: 90 dias, 6 meses, 1 ano, Sem garantia</p>
                                </div>
                            </div>
                      </TabsContent>
                      <TabsContent value="items" className="mt-0 space-y-3">
                        <div className="grid grid-cols-1 gap-1.5">
                          <Label htmlFor="technical_report">Diagnóstico / Laudo Técnico</Label>
                          <Textarea
                            id="technical_report"
                            placeholder="Descrição técnica detalhada do diagnóstico, serviço a ser executado, peças necessárias, etc."
                            value={technicalReport}
                            onChange={(e) => setTechnicalReport(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border">
                                <div className="flex-grow grid grid-cols-12 gap-2 items-center">
                                    <span className="col-span-5 truncate">{item.description}</span>
                                    <span className="col-span-2 text-sm text-muted-foreground">({item.type === 'service' ? 'Serviço' : 'Peça'})</span>
                                    <span className="col-span-1 text-sm text-muted-foreground">Qtd: {item.quantity}</span>
                                    <span className="col-span-2 text-sm text-muted-foreground">Unit: R$ {item.unitPrice.toFixed(2)}</span>
                                    <span className="col-span-2 font-medium text-right">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(item.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-end gap-2 p-2 rounded-md border border-dashed">
                             <div className="flex-grow">
                                <Label htmlFor="newItemDescription" className="text-xs">Descrição</Label>
                                {newItem.type === 'part' ? (
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                                {newItem.description || "Selecione uma peça..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput 
                                                    placeholder="Procurar peça..."
                                                    value={newItem.description}
                                                    onValueChange={(search) => setNewItem({...newItem, description: search })}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {stock.map((stockItem) => (
                                                            <CommandItem
                                                                key={stockItem.id}
                                                                value={stockItem.name}
                                                                onSelect={(currentValue) => {
                                                                    const selected = stock.find(s => s.name.toLowerCase() === currentValue.toLowerCase());
                                                                    if (selected) {
                                                                        setNewItem({ ...newItem, description: selected.name, unitPrice: selected.price });
                                                                    }
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", newItem.description.toLowerCase() === stockItem.name.toLowerCase() ? "opacity-100" : "opacity-0")} />
                                                                {stockItem.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <Input id="newItemDescription" placeholder="Ex: Formatação" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                                )}
                            </div>

                            <div className="w-28">
                              <Label className="text-xs">Tipo</Label>
                              <Select value={newItem.type} onValueChange={(value: 'service' | 'part') => setNewItem({...newItem, type: value, description: '', unitPrice: 0 })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="service">Serviço</SelectItem>
                                  <SelectItem value="part">Peça</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-16">
                              <Label htmlFor="newItemQty" className="text-xs">Qtd</Label>
                              <Input id="newItemQty" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value, 10) || 1})} />
                            </div>
                            <div className="w-24">
                              <Label htmlFor="newItemPrice" className="text-xs">Valor R$</Label>
                              <Input id="newItemPrice" type="number" placeholder="0.00" value={newItem.unitPrice || ''} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})} disabled={newItem.type === 'part'} />
                            </div>
                            <Button onClick={handleAddItem} size="sm">Adicionar</Button>
                          </div>
                          <div className="mt-4 text-right">
                            <p className="text-lg font-bold">Total: R$ {(calculateTotal()).toFixed(2)}</p>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="notes" className="mt-0">
                        <div className="py-2">
                          <div className="grid grid-cols-1 gap-1.5">
                              <Label htmlFor="internal_notes">Comentários Internos</Label>
                              <Textarea
                                id="internal_notes"
                                placeholder="Adicione observações para a equipe. Este conteúdo não será impresso."
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                rows={8}
                              />
                              <p className="text-sm text-muted-foreground">Estas anotações são para uso exclusivo da equipe.</p>
                            </div>
                        </div>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </div>
            </Tabs>
        </div>
        
        <DialogFooter className="p-4 border-t flex-shrink-0 bg-card sm:justify-between">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrada')}><Printer className="mr-2 h-4 w-4" />Recibo Entrada</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Orçamento')}><Printer className="mr-2 h-4 w-4" />Gerar Orçamento</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrega')}><Printer className="mr-2 h-4 w-4" />Recibo Entrega</Button>
            </div>
            <div className="flex justify-end gap-2 mt-4 sm:mt-0">
                <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Salvar Ordem de Serviço'}</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
          <AlertDialogDescription>
            Esta Ordem de Serviço já foi paga pelo cliente?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleFinalize(false)}>
            Não, aguardando
          </Button>
          <Button onClick={() => handleFinalize(true)}>
            Sim, foi paga
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={isManualAddDialogOpen} onOpenChange={setIsManualAddDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Peça fora do estoque</AlertDialogTitle>
          <AlertDialogDescription>
            A peça <span className="font-bold">"{manualAddItem?.description}"</span> não consta no estoque. Deseja adicioná-la mesmo assim?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setManualAddItem(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmManualAdd}>Adicionar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
