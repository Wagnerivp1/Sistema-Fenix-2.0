
'use client';

import * as React from 'react';
import { PlusCircle, Printer, FileText, Trash2, X } from 'lucide-react';
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
import { mockCustomers } from '@/lib/data';
import type { Customer, ServiceOrder } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAiSuggestions } from '@/app/actions';
import type { SuggestResolutionOutput } from '@/ai/flows/suggest-resolution';
import { AiSuggestions } from './ai-suggestions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Separator } from '../ui/separator';

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


export function NewOrderSheet({ customer, serviceOrder, isOpen, onOpenChange, onSave }: NewOrderSheetProps) {
  const { toast } = useToast();
  
  // States para os dados do formulário
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [equipmentType, setEquipmentType] = React.useState('');
  const [equipment, setEquipment] = React.useState({ brand: '', model: '', serial: '' });
  const [accessories, setAccessories] = React.useState('');
  const [reportedProblem, setReportedProblem] = React.useState('');
  const [technicalReport, setTechnicalReport] = React.useState('');
  const [items, setItems] = React.useState<QuoteItem[]>([]);
  const [status, setStatus] = React.useState<ServiceOrder['status']>('Aberta');
  
  const [newItem, setNewItem] = React.useState({ description: '', quantity: 1, unitPrice: 0, type: 'service' as 'service' | 'part' });

  // States para controle da UI
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestResolutionOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isEditing = !!serviceOrder;

  React.useEffect(() => {
    if (isOpen) { // Only update form when dialog is opening
      if (isEditing && serviceOrder) {
          const selectedCustomer = mockCustomers.find(c => c.name === serviceOrder.customerName);
          setSelectedCustomerId(selectedCustomer?.id || '');
          const [type, brand, ...modelParts] = serviceOrder.equipment.split(' ');
          const model = modelParts.join(' ');
          setEquipmentType(type || '');
          setEquipment({
              brand: brand || '',
              model: model || '',
              serial: '', // Mock data, as it's not in the model
          });
          setAccessories(''); // Mock data
          setReportedProblem(serviceOrder.reportedProblem);
          setTechnicalReport(''); // Mock data
          setItems(serviceOrder.items || []); 
          setStatus(serviceOrder.status);
      } else if (customer) {
          setSelectedCustomerId(customer.id);
          // Reset other fields for new order from customer
          setEquipmentType('');
          setEquipment({ brand: '', model: '', serial: '' });
          setAccessories('');
          setReportedProblem('');
          setTechnicalReport('');
          setItems([]);
          setStatus('Aberta');
      } else {
          // Reset all fields for a completely new order
          setSelectedCustomerId('');
          setEquipmentType('');
          setEquipment({ brand: '', model: '', serial: '' });
          setAccessories('');
          setReportedProblem('');
          setTechnicalReport('');
          setItems([]);
          setStatus('Aberta');
      }
    }
  }, [serviceOrder, customer, isEditing, isOpen]);


  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEquipment(prev => ({ ...prev, [id]: value }));
  };

  const handleAddItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.unitPrice >= 0) {
      setItems([...items, { ...newItem, id: Date.now() }]);
      setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service' }); // Reset for next item
    } else {
        toast({
            variant: 'destructive',
            title: 'Item inválido',
            description: 'Preencha a descrição e o valor do item.',
        })
    }
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const calculateTotal = (type?: 'service' | 'part') => {
    const filteredItems = type ? items.filter(item => item.type === type) : items;
    return filteredItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  };

  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (equipmentType && reportedProblem) {
      setIsAiLoading(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        const result = await getAiSuggestions(equipmentType, reportedProblem);
        if (result.success) {
          setAiSuggestions(result.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro na IA',
            description: result.error,
          });
          setAiSuggestions(null);
        }
        setIsAiLoading(false);
      }, 1000); // 1 segundo de debounce
    } else {
        setAiSuggestions(null);
        setIsAiLoading(false);
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [equipmentType, reportedProblem, toast]);
  
  const handleSave = () => {
    const selectedCustomer = mockCustomers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, selecione um cliente.' });
      return;
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
    }
    
    if (onSave) {
        onSave(finalOrder);
    }
  };

  const generatePdfBase = (title: string): { doc: jsPDF, selectedCustomer: Customer, currentY: number, pageWidth: number, margin: number } | null => {
    const selectedCustomer = mockCustomers.find(c => c.id === selectedCustomerId);
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

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("Sistema Fênix", margin, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Rua da Tecnologia, 123 - Centro", margin, 24);
    doc.text("Telefone: (11) 99999-8888 | E-mail: contato@sistemafenix.com", margin, 29);

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
    
    const drawBoxWithTitle = (title: string, x: number, y: number, width: number, height: number, text: string | string[]) => {
      doc.setFillColor(primaryColor);
      doc.rect(x, y, width, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(fontColor);
      doc.text(title, x + 3, y + 6);
      doc.setDrawColor(primaryColor);
      doc.rect(x, y + 8, width, height - 8, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(fontColor);
      const textArray = Array.isArray(text) ? text : [text];
      doc.text(textArray, x + 3, y + 14);
    };

    const boxWidth = (pageWidth - (margin * 2));
    
    const customerInfo = [
      `Nome: ${selectedCustomer.name}`,
      `Telefone: ${selectedCustomer.phone}`,
      `Endereço: ${selectedCustomer.address || 'Não informado'}`,
    ];
    drawBoxWithTitle('Dados do Cliente', margin, currentY, boxWidth, 25, customerInfo);
    currentY += 35;

    const equipmentInfo = [
      `Tipo: ${equipmentType}`,
      `Marca / Modelo: ${equipment.brand} ${equipment.model}`,
      `Nº Série: ${equipment.serial || 'Não informado'}`,
      `Acessórios: ${accessories || 'Nenhum'}`,
    ];
    drawBoxWithTitle('Informações do Equipamento', margin, currentY, boxWidth, 30, equipmentInfo);
    currentY += 40;
    
    const problemText = doc.splitTextToSize(reportedProblem, boxWidth - 6);
    drawBoxWithTitle('Defeito Reclamado', margin, currentY, boxWidth, 25, problemText);
    currentY += 35;

    const servicesText = doc.splitTextToSize(technicalReport || 'Aguardando diagnóstico técnico.', boxWidth - 6);
    drawBoxWithTitle('Diagnóstico / Laudo Técnico', margin, currentY, boxWidth, 30, servicesText);
    currentY += 40;

    if (items.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
        body: items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: fontColor, fontStyle: 'bold' },
        footStyles: { fillColor: secondaryColor, textColor: fontColor },
        margin: { left: margin, right: margin }
      });
      currentY = doc.lastAutoTable.finalY;
    }
    
    const grandTotal = calculateTotal();
    currentY += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(fontColor);
    doc.text(`Valor Total: R$ ${grandTotal.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(fontColor);
    doc.text('Validade e Condições:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    currentY += 4;
    const warrantyText = "Este orçamento é válido por até 3 dias. A execução dos serviços ocorrerá somente após aprovação do cliente. Peças e serviços podem ser alterados após análise técnica.";
    doc.text(doc.splitTextToSize(warrantyText, pageWidth - (margin * 2)), margin, currentY);
    currentY += 25;
    
    doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
    currentY += 4;
    doc.setFontSize(9);
    doc.setTextColor(fontColor);
    doc.text('Assinatura do Cliente (Aprovação)', pageWidth / 2, currentY, { align: 'center'});

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const generateServiceOrderPdf = () => {
    const base = generatePdfBase("Ordem de Serviço");
    if (!base) return;
    let { doc, selectedCustomer, currentY, pageWidth, margin } = base;

    const fontColor = '#000000';
    const primaryColor = '#e0e7ff';
    const secondaryColor = '#f3f4f6';

     const drawBoxWithTitle = (title: string, x: number, y: number, width: number, height: number, text: string | string[]) => {
      doc.setFillColor(primaryColor);
      doc.rect(x, y, width, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(fontColor);
      doc.text(title, x + 3, y + 6);
      doc.setDrawColor(primaryColor);
      doc.rect(x, y + 8, width, height - 8, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(fontColor);
      const textArray = Array.isArray(text) ? text : [text];
      doc.text(textArray, x + 3, y + 14);
    };

    const boxWidth = (pageWidth - (margin * 2));
    
    const customerInfo = [
      `Nome: ${selectedCustomer.name}`,
      `Telefone: ${selectedCustomer.phone}`,
      `Endereço: ${selectedCustomer.address || 'Não informado'}`,
    ];
    drawBoxWithTitle('Dados do Cliente', margin, currentY, boxWidth, 25, customerInfo);
    currentY += 35;

    const equipmentInfo = [
      `Tipo: ${equipmentType}`,
      `Marca / Modelo: ${equipment.brand} ${equipment.model}`,
      `Nº Série: ${equipment.serial || 'Não informado'}`,
      `Acessórios: ${accessories || 'Nenhum'}`,
    ];
    drawBoxWithTitle('Informações do Equipamento', margin, currentY, boxWidth, 30, equipmentInfo);
    currentY += 40;
    
    const problemText = doc.splitTextToSize(reportedProblem, boxWidth - 6);
    drawBoxWithTitle('Defeito Reclamado', margin, currentY, boxWidth, 25, problemText);
    currentY += 35;

    const servicesText = doc.splitTextToSize(technicalReport || 'Aguardando diagnóstico técnico.', boxWidth - 6);
    drawBoxWithTitle('Diagnóstico / Laudo Técnico', margin, currentY, boxWidth, 30, servicesText);
    currentY += 40;

    if (items.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
        body: items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: fontColor, fontStyle: 'bold' },
        footStyles: { fillColor: secondaryColor, textColor: fontColor },
        margin: { left: margin, right: margin }
      });
      currentY = doc.lastAutoTable.finalY;
    }
    
    const grandTotal = calculateTotal();
    currentY += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(fontColor);
    doc.text(`Valor Total: R$ ${grandTotal.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(fontColor);
    doc.text('Termos de Garantia e Serviço:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    currentY += 4;
    const warrantyText = "A garantia para os serviços prestados é de 90 dias, cobrindo apenas o defeito reparado. A garantia não cobre danos por mau uso, quedas, líquidos ou sobrecarga elétrica.";
    doc.text(doc.splitTextToSize(warrantyText, pageWidth - (margin * 2)), margin, currentY);
    currentY += 25;
    
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
    const base = generatePdfBase("Recibo de Entrada");
    if (!base) return;
    let { doc, selectedCustomer, currentY, pageWidth, margin } = base;

    const fontColor = '#000000';
    const primaryColor = '#e0e7ff';
    
    const drawBoxWithTitle = (title: string, x: number, y: number, width: number, height: number, text: string | string[]) => {
      doc.setFillColor(primaryColor);
      doc.rect(x, y, width, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(fontColor);
      doc.text(title, x + 3, y + 6);
      doc.setDrawColor(primaryColor);
      doc.rect(x, y + 8, width, height - 8, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(fontColor);
      const textArray = Array.isArray(text) ? text : [text];
      doc.text(textArray, x + 3, y + 14);
    };

    const boxWidth = (pageWidth - (margin * 2));
    
    const customerInfo = [
      `Nome: ${selectedCustomer.name}`,
      `Telefone: ${selectedCustomer.phone}`,
    ];
    drawBoxWithTitle('Dados do Cliente', margin, currentY, boxWidth, 20, customerInfo);
    currentY += 30;

    const equipmentInfo = [
      `Tipo: ${equipmentType}`,
      `Marca / Modelo: ${equipment.brand} ${equipment.model}`,
      `Nº Série: ${equipment.serial || 'Não informado'}`,
      `Acessórios: ${accessories || 'Nenhum'}`,
    ];
    drawBoxWithTitle('Informações do Equipamento', margin, currentY, boxWidth, 30, equipmentInfo);
    currentY += 40;
    
    const problemText = doc.splitTextToSize(reportedProblem, boxWidth - 6);
    drawBoxWithTitle('Defeito Reclamado', margin, currentY, boxWidth, 25, problemText);
    currentY += 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(fontColor);
    doc.text('IMPORTANTE:', margin, currentY);
    currentY += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const termsText = "A apresentação deste recibo é INDISPENSÁVEL para a retirada do equipamento. A não apresentação implicará na necessidade de o titular apresentar documento com foto para a liberação.";
    doc.text(doc.splitTextToSize(termsText, pageWidth - (margin * 2)), margin, currentY);
    currentY += 30;
    
    doc.line(pageWidth / 2 - 50, currentY, pageWidth / 2 + 50, currentY);
    currentY += 5;
    doc.setFontSize(10);
    doc.text('Assinatura do Cliente', pageWidth / 2, currentY, { align: 'center'});

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
        generateServiceOrderPdf();
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!onOpenChange && trigger}
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar Ordem de Serviço #${serviceOrder?.id.slice(-4)}` : 'Nova Ordem de Serviço'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Altere os dados do atendimento.` : 'Preencha os dados para registrar um novo atendimento.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4 pr-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label htmlFor="customer">Cliente</Label>
                   <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div>
                <Label htmlFor="status">Status da OS</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ServiceOrder['status'])}>
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
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
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
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="accessories">Acessórios Entregues com o Equipamento</Label>
              <Textarea
                id="accessories"
                placeholder="Ex: Carregador original, mochila preta e adaptador HDMI."
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
              />
               <p className="text-sm text-muted-foreground">Descreva todos os acessórios que o cliente deixou junto com o equipamento.</p>
            </div>
             <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="problem">Defeito Reclamado</Label>
              <Textarea
                id="problem"
                placeholder="Descrição detalhada do problema informado pelo cliente."
                 value={reportedProblem} 
                 onChange={(e) => setReportedProblem(e.target.value)}
              />
            </div>
             {(isAiLoading || aiSuggestions) && (
              <AiSuggestions suggestions={aiSuggestions} isLoading={isAiLoading} />
            )}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="technical_report">Diagnóstico / Laudo Técnico</Label>
              <Textarea
                id="technical_report"
                placeholder="Descrição técnica detalhada do diagnóstico, serviço a ser executado, peças necessárias, etc."
                value={technicalReport}
                onChange={(e) => setTechnicalReport(e.target.value)}
                rows={5}
              />
            </div>

             <Separator />
            
            <div>
              <Label className="text-base font-semibold">Serviços e Peças</Label>
              <div className="mt-4 space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border">
                    <div className="flex-grow grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-5">{item.description}</span>
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

               <div className="mt-4 flex items-end gap-2 p-2 rounded-md border border-dashed">
                <div className="flex-grow">
                  <Label htmlFor="newItemDescription">Descrição do Item</Label>
                  <Input id="newItemDescription" placeholder="Ex: Formatação, Troca de Tela" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <div className="w-32">
                  <Label>Tipo</Label>
                   <Select value={newItem.type} onValueChange={(value: 'service' | 'part') => setNewItem({...newItem, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Serviço</SelectItem>
                      <SelectItem value="part">Peça</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <Label htmlFor="newItemQty">Qtd.</Label>
                  <Input id="newItemQty" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value, 10) || 1})} />
                </div>
                <div className="w-32">
                  <Label htmlFor="newItemPrice">Valor R$</Label>
                  <Input id="newItemPrice" type="number" placeholder="0.00" value={newItem.unitPrice || ''} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})} />
                </div>
                <Button onClick={handleAddItem} size="sm">Adicionar Item</Button>
              </div>

               <div className="mt-4 text-right">
                <p className="text-lg font-bold">Total: R$ {(calculateTotal()).toFixed(2)}</p>
              </div>
            </div>

          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 pt-4 border-t sm:justify-between">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Orçamento')}><Printer className="mr-2 h-4 w-4" />Orçamento</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Reimpressão de OS')}><Printer className="mr-2 h-4 w-4" />Reimprimir OS</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrada')}><FileText className="mr-2 h-4 w-4" />Recibo Entrada</Button>
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
  );
}
