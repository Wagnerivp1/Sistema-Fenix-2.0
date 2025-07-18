
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

    // --- PDF Styling ---
    const primaryColor = '#3F51B5'; 
    const grayColor = '#4a5568';
    const lightGrayColor = '#E8EAF6';
    const osNumber = `OS-${Date.now().toString().slice(-6)}`;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text("Assistec Now", 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(grayColor);
    doc.text("Rua da Tecnologia, 123 - Centro", 14, 28);
    doc.text("Telefone: (99) 99999-9999 | Email: contato@assistecnow.com", 14, 33);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Orçamento", pageWidth - 14, 22, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${osNumber}`, pageWidth - 14, 28, { align: 'right' });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 14, 33, { align: 'right' });

    doc.setDrawColor(primaryColor);
    doc.line(14, 40, pageWidth - 14, 40);

    // --- Customer and Equipment Info ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text("CLIENTE", 14, 50);
    doc.text("EQUIPAMENTO", pageWidth / 2, 50);
    
    doc.setDrawColor(grayColor);
    doc.line(14, 52, 95, 52); // Line under CLIENTE
    doc.line(pageWidth / 2, 52, pageWidth - 14, 52); // Line under EQUIPAMENTO

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor);

    // Customer
    doc.text(selectedCustomer.name, 14, 58);
    doc.text(selectedCustomer.phone, 14, 63);
    doc.text(selectedCustomer.address, 14, 68);

    // Equipment
    doc.text(`${equipmentType} ${equipment.brand} ${equipment.model}`, pageWidth / 2, 58);
    doc.text(`Nº de Série: ${equipment.serial || 'Não informado'}`, pageWidth / 2, 63);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`DEFEITO RECLAMADO:`, 14, 78);
    doc.setFont('helvetica', 'normal');
    
    const problemLines = doc.splitTextToSize(reportedProblem, pageWidth - 28);
    let currentY = 83;
    doc.text(problemLines, 14, currentY);
    currentY += (problemLines.length * 5); // Approximate height of text block

    // --- Items Table ---
    const tableColumn = ["Item", "Descrição", "Qtd.", "Vlr. Unit.", "Subtotal"];
    const tableRows = items.map((item, index) => [
      index + 1,
      item.description,
      item.quantity,
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${(item.quantity * item.unitPrice).toFixed(2)}`
    ]);
    
    const total = calculateTotal();
    tableRows.push([
        { content: 'Total do Orçamento:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `R$ ${total.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);


    doc.autoTable({
        startY: currentY + 5,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { 
            fillColor: primaryColor, 
            textColor: '#ffffff',
            fontStyle: 'bold'
        },
        footStyles: {
            fillColor: lightGrayColor,
            textColor: grayColor,
            fontStyle: 'bold',
            fontSize: 12
        },
        didDrawPage: (data) => {
            // Footer on each page
            doc.setFontSize(8);
            doc.setTextColor(grayColor);
            doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    });

    // --- Footer ---
    const finalY = doc.lastAutoTable.finalY || pageHeight - 50;
    doc.setFontSize(9);
    doc.setTextColor(grayColor);
    doc.text("Validade do Orçamento: 15 dias.", 14, finalY + 15);
    doc.text("Garantia de 90 dias sobre o serviço executado.", 14, finalY + 20);

    doc.line(pageWidth / 2 - 40, finalY + 40, pageWidth / 2 + 40, finalY + 40);
    doc.text("Assinatura do Cliente", pageWidth / 2, finalY + 45, { align: 'center' });
    
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

    