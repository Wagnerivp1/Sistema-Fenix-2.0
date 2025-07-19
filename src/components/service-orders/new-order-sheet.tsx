
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
import { getCustomers, getStock } from '@/lib/storage';
import type { Customer, ServiceOrder, StockItem } from '@/types';
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

export function NewOrderSheet({ customer, serviceOrder, isOpen, onOpenChange, onSave }: NewOrderSheetProps) {
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

  const handleSaveAndPrint = () => {
    const finalOrder = getFinalOrderData();
    if (finalOrder) {
      if (onSave) {
        onSave(finalOrder);
      }
      generateServiceOrderPdf(finalOrder);
    }
  }


 const generatePdfBase = (title: string): { doc: jsPDF, selectedCustomer: Customer, currentY: number, pageWidth: number, margin: number } | null => {
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
        toast({ variant: 'destructive', title: 'Cliente não selecionado!'});
        return null;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const fontColor = '#000000';

    doc.setFont('helvetica');
    doc.setTextColor(fontColor);

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, 10, 30, 25, 'F');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Sua Logo', margin + 7, 23);
    doc.setTextColor(fontColor);

    const companyInfoX = margin + 35;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("JL Informática", companyInfoX, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Rua da Tecnologia, 123 - Centro", companyInfoX, 24);
    doc.text("Telefone: (11) 99999-8888 | E-mail: contato@jlinformatica.com", companyInfoX, 29);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const osId = serviceOrder?.id ? `#${serviceOrder.id.slice(-4)}` : `#...${Date.now().toString().slice(-4)}`;
    doc.text(title, pageWidth - margin, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº: ${osId}`, pageWidth - margin, 24, { align: 'right' });
    doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 29, { align: 'right' });

    return { doc, selectedCustomer, currentY: 40, pageWidth, margin };
  }

  const generateQuotePdf = () => {
    const base = generatePdfBase("Orçamento de Serviço");
    if (!base) return;
    let { doc, selectedCustomer, currentY, pageWidth, margin } = base;

    const fontColor = '#000000';
    const primaryColor = '#e0e7ff';
    const secondaryColor = '#f3f4f6';
    
    doc.setTextColor(fontColor);
    
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

      return y + boxHeight + 8; // Return new Y position
    };

    const boxWidth = (pageWidth - (margin * 2));
    
    const customerInfo = [
      `Nome: ${selectedCustomer.name}`,
      `Telefone: ${selectedCustomer.phone}`,
      `Endereço: ${selectedCustomer.address || 'Não informado'}`,
    ];
    currentY = drawBoxWithTitle('Dados do Cliente', margin, currentY, boxWidth, 15, customerInfo);

    const equipmentInfo = [
      `Tipo: ${equipmentType}`,
      `Marca / Modelo: ${equipment.brand} ${equipment.model}`,
      `Nº Série: ${equipment.serial || 'Não informado'}`,
      `Acessórios: ${accessories || 'Nenhum'}`,
    ];
    currentY = drawBoxWithTitle('Informações do Equipamento', margin, currentY, boxWidth, 20, equipmentInfo);
    
    const problemText = doc.splitTextToSize(reportedProblem || "Não informado", boxWidth - 4);
    currentY = drawBoxWithTitle('Defeito Reclamado', margin, currentY, boxWidth, 15, problemText);

    const servicesText = doc.splitTextToSize(technicalReport || 'Aguardando diagnóstico técnico.', boxWidth - 4);
    currentY = drawBoxWithTitle('Diagnóstico / Laudo Técnico', margin, currentY, boxWidth, 20, servicesText);

    if (items.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
        body: items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: fontColor, fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
        bodyStyles: { fontSize: 8, cellPadding: 1.5 },
        footStyles: { fillColor: secondaryColor, textColor: fontColor },
        margin: { left: margin, right: margin }
      });
      currentY = doc.lastAutoTable.finalY;
    }
    
    const grandTotal = calculateTotal();
    currentY += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(fontColor);
    doc.text(`Valor Total: R$ ${grandTotal.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
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

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const generateServiceOrderPdf = (orderToPrint: ServiceOrder) => {
    const base = generatePdfBase("Ordem de Serviço");
    if (!base) return;
    let { doc, selectedCustomer, currentY, pageWidth, margin } = base;

    const fontColor = '#000000';
    const primaryColor = '#e0e7ff';
    const secondaryColor = '#f3f4f6';

    doc.setTextColor(fontColor);

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

      return y + boxHeight + 8; // Return new Y position
    };
    
    const boxWidth = (pageWidth - (margin * 2));
    
    const customerInfo = [
      `Nome: ${selectedCustomer.name}`,
      `Telefone: ${selectedCustomer.phone}`,
      `Endereço: ${selectedCustomer.address || 'Não informado'}`,
    ];
    currentY = drawBoxWithTitle('Dados do Cliente', margin, currentY, boxWidth, 15, customerInfo);

    const equipmentInfo = [
      `Tipo: ${equipmentType}`,
      `Marca / Modelo: ${equipment.brand} ${equipment.model}`,
      `Nº Série: ${equipment.serial || 'Não informado'}`,
      `Acessórios: ${accessories || 'Nenhum'}`,
    ];
    currentY = drawBoxWithTitle('Informações do Equipamento', margin, currentY, boxWidth, 20, equipmentInfo);
    
    const problemText = doc.splitTextToSize(reportedProblem || "Não informado", boxWidth - 4);
    currentY = drawBoxWithTitle('Defeito Reclamado', margin, currentY, boxWidth, 15, problemText);

    const servicesText = doc.splitTextToSize(technicalReport || 'Aguardando diagnóstico técnico.', boxWidth - 4);
    currentY = drawBoxWithTitle('Diagnóstico / Laudo Técnico', margin, currentY, boxWidth, 20, servicesText);

    if (items.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
        body: items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: fontColor, fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
        bodyStyles: { fontSize: 8, cellPadding: 1.5 },
        footStyles: { fillColor: secondaryColor, textColor: fontColor },
        margin: { left: margin, right: margin }
      });
      currentY = doc.lastAutoTable.finalY;
    }
    
    const grandTotal = calculateTotal();
    currentY += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(fontColor);
    doc.text(`Valor Total: R$ ${grandTotal.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(fontColor);
    doc.text('Termos de Garantia e Serviço:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    currentY += 3;
    
    let warrantyText = `A garantia para os serviços prestados é de ${warranty}, cobrindo apenas o defeito reparado. A garantia não cobre danos por mau uso, quedas, líquidos ou sobrecarga elétrica.`;

    // Add warranty start and end date if applicable
    const deliveredDate = orderToPrint.deliveredDate;
    if (orderToPrint.status === 'Entregue' && deliveredDate && warranty) {
        let defaultWarrantyDays = 90;
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                defaultWarrantyDays = JSON.parse(savedSettings).defaultWarrantyDays || 90;
            }
        } catch (e) { /* ignore */ }

        const match = warranty.match(/(\d+)\s*(dias|meses|mes|ano|anos)/i);
        let duration: Duration = { days: defaultWarrantyDays };

        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            if (unit.startsWith('dia')) duration = { days: value };
            else if (unit.startsWith('mes')) duration = { months: value };
            else if (unit.startsWith('ano')) duration = { years: value };
        }
        
        const [year, month, day] = deliveredDate.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, month - 1, day));
        const endDate = add(startDate, duration);
        const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        warrantyText += ` Período da Garantia: de ${formatDate(startDate)} até ${formatDate(endDate)}.`;
    }

    doc.text(doc.splitTextToSize(warrantyText, pageWidth - (margin * 2)), margin, currentY);
    currentY += 12;
    
    doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
    currentY += 4;
    doc.setFontSize(9);
    doc.setTextColor(fontColor);
    doc.text('Assinatura do Cliente', pageWidth / 2, currentY, { align: 'center'});

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

const generateEntryReceiptPdf = () => {
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
        toast({ variant: "destructive", title: "Cliente não selecionado!" });
        return;
    }

    const doc = new jsPDF({ format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const fontColor = '#000000';
    const primaryColor = '#f3f4f6';

    const drawReceiptContent = (yOffset: number, via: string) => {
        let currentY = yOffset;

        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, 25, 18, 'F');
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text('Sua Logo', margin + 4.5, currentY + 11);
        doc.setTextColor(fontColor);

        const companyInfoX = margin + 30;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("JL Informática", companyInfoX, currentY + 7);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Rua da Tecnologia, 123 | Fone: (11) 99999-8888", companyInfoX, currentY + 12);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Recibo de Entrada - ${via}`, pageWidth - margin, currentY + 8, { align: 'right' });

        currentY += 18;
        doc.setDrawColor(209, 213, 219);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 4;

        const drawInfoBox = (title: string, lines: string[], startY: number): number => {
            const boxWidth = pageWidth - (margin * 2);
            const titleHeight = 5;
            const textLines = lines.map(line => doc.splitTextToSize(line, boxWidth - 4)).flat();
            const textHeight = doc.getTextDimensions(textLines).h + 2;
            const boxHeight = titleHeight + textHeight;

            doc.setFillColor(primaryColor);
            doc.rect(margin, startY, boxWidth, titleHeight, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(title, margin + 2, startY + 3.5);

            doc.setDrawColor(224, 231, 255);
            doc.rect(margin, startY + titleHeight, boxWidth, textHeight, 'S');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(textLines, margin + 2, startY + titleHeight + 4);

            return startY + boxHeight;
        };

        const osId = serviceOrder?.id ? `#${serviceOrder.id.slice(-4)}` : `#...${Date.now().toString().slice(-4)}`;
        currentY = drawInfoBox('Dados do Cliente', [`Nº OS: ${osId} | Cliente: ${selectedCustomer.name}`, `Telefone: ${selectedCustomer.phone}`], currentY);
        currentY = drawInfoBox('Informações do Equipamento', [`Equipamento: ${equipmentType} ${equipment.brand} ${equipment.model}`, `Nº Série: ${equipment.serial || 'Não informado'} | Acessórios: ${accessories || 'Nenhum'}`], currentY + 1);
        currentY = drawInfoBox('Defeito Reclamado', [reportedProblem || 'Não informado'], currentY + 1);
        currentY += 2;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const termsText = "A apresentação deste recibo é INDISPENSÁVEL para a retirada do equipamento. A não apresentação implicará na necessidade de o titular apresentar documento com foto para a liberação.";

        const textLines = doc.splitTextToSize(termsText, pageWidth - (margin * 2));
        doc.text(textLines, pageWidth / 2, currentY, { align: 'center' });
        currentY += doc.getTextDimensions(textLines).h + 3;

        doc.line(margin + 20, currentY, pageWidth - margin - 20, currentY);
        currentY += 3;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Assinatura do Cliente', pageWidth / 2, currentY, { align: 'center' });

        return currentY;
    };

    const firstReceiptEndY = drawReceiptContent(8, "Via do Cliente");
    const receiptHeight = firstReceiptEndY + 5;

    const cutLineY = receiptHeight;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, cutLineY, pageWidth - margin, cutLineY);
    doc.setLineDashPattern([], 0);

    drawReceiptContent(cutLineY + 2, "Via da Loja");

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
};

  const handlePrint = (documentType: string) => {
    switch (documentType) {
      case 'Orçamento':
        generateQuotePdf();
        break;
      case 'Reimpressão de OS':
        const orderData = getFinalOrderData();
        if (orderData) {
            generateServiceOrderPdf(orderData);
        }
        break;
      case 'Recibo de Entrada':
        generateEntryReceiptPdf();
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
    <DialogTrigger asChild>
      <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground">
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Adicionar OS
        </span>
         <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
            O
          </kbd>
      </Button>
    </DialogTrigger>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                <TabsList className="grid w-full grid-cols-3 mx-4 flex-shrink-0">
                    <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                    <TabsTrigger value="items">Serviços e Peças</TabsTrigger>
                    <TabsTrigger value="notes">Comentários</TabsTrigger>
                </TabsList>

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
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Orçamento')}><Printer className="mr-2 h-4 w-4" />Gerar Orçamento</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Reimpressão de OS')}><Printer className="mr-2 h-4 w-4" />Reimprimir OS</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrada')}><FileText className="mr-2 h-4 w-4" />Recibo Entrada</Button>
            </div>
            <div className="flex justify-end gap-2 mt-4 sm:mt-0">
                <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                {status === 'Entregue' ? (
                    <Button onClick={handleSaveAndPrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Salvar e Imprimir Recibo
                    </Button>
                ) : (
                    <Button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Salvar Ordem de Serviço'}</Button>
                )}
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

    

    