
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
import type { Customer } from '@/types';
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
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

interface QuoteItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}


export function NewOrderSheet({ customer, isOpen, onOpenChange }: NewOrderSheetProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  const [equipmentType, setEquipmentType] = React.useState('');
  const [reportedProblem, setReportedProblem] = React.useState('');
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestResolutionOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const [equipment, setEquipment] = React.useState({ brand: '', model: '', serial: '' });
  const [items, setItems] = React.useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = React.useState({ description: '', quantity: 1, unitPrice: 0 });

  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEquipment(prev => ({ ...prev, [id]: value }));
  };

  const handleAddItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.unitPrice >= 0) {
      setItems([...items, { ...newItem, id: Date.now() }]);
      setNewItem({ description: '', quantity: 1, unitPrice: 0 }); // Reset for next item
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
  
  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  };


  React.useEffect(() => {
    if (customer) {
      setSelectedCustomerId(customer.id);
    }
  }, [customer]);

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
    console.log("Saving service order...");
    toast({
      title: 'Ordem de Serviço Salva!',
      description: 'A nova ordem de serviço foi registrada com sucesso.',
    });
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const generateQuotePdf = () => {
    const selectedCustomer = mockCustomers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
        toast({ variant: 'destructive', title: 'Cliente não selecionado!'});
        return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- Colors ---
    const primaryColor = '#283593'; // Um azul mais escuro
    const secondaryColor = '#3F51B5';
    const lightGrayColor = '#F5F5F5';
    const fontColor = '#424242';
    
    // --- Header ---
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor('#FFFFFF');
    doc.text("Orçamento", margin, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("Sistema Fênix - Assistência Técnica", margin, 25);
    doc.text("Endereço: Rua da Tecnologia, 123 - Cidade", margin, 29);
    doc.text("Telefone: (12) 3456-7890 | E-mail: contato@fenix.com", margin, 33);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Sistema Fênix", pageWidth - margin, 25, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Assistência Técnica", pageWidth - margin, 30, { align: 'right' });


    // --- Customer Info ---
    let currentY = 50;
    const fieldHeight = 8;
    const fieldStyle = {
        fillColor: '#FFFFFF',
        lineWidth: 0.2,
        drawColor: '#BDBDBD'
    };
    
    doc.setFontSize(8);
    doc.setTextColor(fontColor);

    const addInfoField = (label: string, value: string, y: number) => {
        doc.text(label, margin + 2, y + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(value, margin + 25, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.roundedRect(margin, y, pageWidth - (margin * 2), fieldHeight, 1, 1, 'S');
        return y + fieldHeight;
    }

    currentY = addInfoField("Cliente:", selectedCustomer.name, currentY);
    currentY = addInfoField("CPF/CNPJ:", selectedCustomer.id.split('-')[1] || 'Não informado', currentY);
    currentY = addInfoField("Endereço:", selectedCustomer.address, currentY);
    currentY = addInfoField("Telefone:", selectedCustomer.phone, currentY);
    currentY += 5; // spacing

    // --- Equipment and Problem ---
    doc.text(`Equipamento: ${equipmentType} ${equipment.brand} ${equipment.model}`, margin, currentY);
    currentY += 5;
    doc.text(`Defeito Reclamado: ${reportedProblem}`, margin, currentY);
    currentY += 10;

    // --- Items Table ---
    const tableColumn = ["DESCRIÇÃO DO SERVIÇO", "QUANT.", "UNITÁRIO (R$)", "TOTAL (R$)"];
    const tableRows = items.map((item) => [
      item.description,
      item.quantity,
      item.unitPrice.toFixed(2),
      (item.quantity * item.unitPrice).toFixed(2)
    ]);
    
    const total = calculateTotal();

    doc.autoTable({
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
            fillColor: primaryColor, 
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            halign: 'center',
        },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2,
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
        },
        didDrawPage: (data) => {
            // Footer on each page
            doc.setFontSize(8);
            doc.setTextColor(fontColor);
            doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    });

    currentY = doc.lastAutoTable.finalY;

    // --- Totals ---
    const totalFieldX = pageWidth - margin - 60;
    doc.setFillColor(primaryColor);
    doc.rect(margin, currentY, pageWidth - (margin * 2) - 65, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#FFFFFF');
    doc.text("TOTAL:", totalFieldX - 25, currentY + 5.5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(fontColor);
    doc.rect(totalFieldX, currentY, 60, 8, 'S');
    doc.text(`R$ ${total.toFixed(2)}`, totalFieldX + 58, currentY + 5.5, { align: 'right' });
    currentY += 15;
    
    // --- Observations ---
    doc.setFillColor(lightGrayColor);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 30, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(fontColor);
    doc.text("Observações", margin + 3, currentY + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const observations = [
        "1. Este orçamento é válido por 15 dias a partir da data de emissão.",
        "2. O prazo de entrega será combinado após a aprovação do orçamento.",
        "3. Em caso de desistência após o início do serviço, será cobrado um valor proporcional.",
        "4. Garantia de 90 dias sobre o(s) serviço(s) executado(s)."
    ];
    doc.text(observations, margin + 3, currentY + 12);
    currentY += 35;

    // --- Signatures ---
    doc.text(`Data: ____ / ____ / ________`, margin, currentY);
    currentY += 15;
    doc.line(margin, currentY, margin + 80, currentY);
    doc.text("Assinatura do Cliente", margin + 40, currentY + 4, { align: 'center' });
    
    doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
    doc.text("Assinatura do Técnico", pageWidth - margin - 40, currentY + 4, { align: 'center' });
    
    // --- Auto Print ---
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob.toString(), '_blank');
  };


  const handlePrint = (documentType: string) => {
    if (documentType === 'Orçamento') {
      generateQuotePdf();
      return;
    }
    toast({
        title: 'Imprimindo documento...',
        description: `O ${documentType} será impresso.`,
    })
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
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados para registrar um novo atendimento.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4 pr-6">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <Label htmlFor="customer">Selecione um cliente</Label>
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
                        <span className="col-span-6">{item.description}</span>
                        <span className="col-span-2 text-sm text-muted-foreground">Qtd: {item.quantity}</span>
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
                <p className="text-lg font-bold">Total: R$ {calculateTotal().toFixed(2)}</p>
              </div>
            </div>

          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 pt-4 border-t flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Orçamento')}><Printer className="mr-2 h-4 w-4" />Orçamento</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Reimpressão de OS')}><Printer className="mr-2 h-4 w-4" />Reimprimir OS</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrada')}><FileText className="mr-2 h-4 w-4" />Recibo Entrada</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrega')}><FileText className="mr-2 h-4 w-4" />Recibo Entrega</Button>
            </div>
            <div className="flex justify-end gap-2">
                <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSave}>Salvar Ordem de Serviço</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
