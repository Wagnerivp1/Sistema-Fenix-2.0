
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getCustomers, getStock, getCompanyInfo, saveCustomers, getKits } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Trash2,
  ScanLine,
  PlusCircle,
  Printer,
  FileText,
  UserPlus,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { addDays } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Quote, Customer, StockItem, SaleItem, User, CompanyInfo, Kit } from '@/types';
import { ManualAddItemDialog } from '@/components/sales/manual-add-item-dialog';


declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}


const initialNewCustomerState: Omit<Customer, 'id'> = { name: '', phone: '', email: '', address: '', document: '' };

interface QuoteBuilderProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  quote: Quote | null;
  onSave: (quote: Quote) => void;
}

export function QuoteBuilder({ isOpen, onOpenChange, quote, onSave }: QuoteBuilderProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [kits, setKits] = React.useState<Kit[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  const [items, setItems] = React.useState<SaleItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [observations, setObservations] = React.useState('');
  const [barcode, setBarcode] = React.useState('');

  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState(initialNewCustomerState);

  React.useEffect(() => {
    const loadPrerequisites = async () => {
      const [customersData, stockData, kitsData] = await Promise.all([
        getCustomers(),
        getStock(),
        getKits(),
      ]);
      setCustomers(customersData);
      setStock(stockData);
      setKits(kitsData);
    };
    if (isOpen) {
      loadPrerequisites();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      if (quote) {
        setSelectedCustomerId(quote.customerId);
        setItems(quote.items);
        setDiscount(quote.discount || 0);
        setObservations(quote.observations || '');
      } else {
        // Reset for new quote
        setSelectedCustomerId(undefined);
        setItems([]);
        setDiscount(0);
        setObservations('');
        setBarcode('');
      }
    }
  }, [isOpen, quote]);
  
  const handleAddItem = (item: Omit<SaleItem, 'id'>) => {
    setItems(prev => {
        const existing = prev.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
            return prev.map(i => i.name.toLowerCase() === item.name.toLowerCase() ? {...i, quantity: i.quantity + item.quantity} : i);
        }
        return [...prev, { ...item, id: `manual-${Date.now()}` }];
    });
  };

  const addStockItemToSale = (stockItem: StockItem, quantity = 1) => {
    setItems(prev => {
        const existing = prev.find(i => i.id === stockItem.id);
        if (existing) {
            return prev.map(i => i.id === stockItem.id ? {...i, quantity: i.quantity + quantity} : i);
        }
        return [...prev, { id: stockItem.id, name: stockItem.name, price: stockItem.price, quantity }];
    });
  };
  
  const handleBarcodeScan = () => {
    if (!barcode.trim()) return;
    const product = stock.find(p => p.barcode === barcode.trim());
    if (product) {
        addStockItemToSale(product);
        setBarcode('');
    } else {
        toast({ variant: "destructive", title: "Produto não encontrado" });
    }
  };

  const handleAddKit = (kitId: string) => {
    const selectedKit = kits.find(k => k.id === kitId);
    if (!selectedKit) return;

    let itemsToAdd: SaleItem[] = [];

    selectedKit.items.forEach(kitItem => {
        const stockItem = stock.find(s => s.id === kitItem.productId);
        if (stockItem) {
            itemsToAdd.push({
                id: stockItem.id,
                name: stockItem.name,
                price: stockItem.price,
                quantity: kitItem.quantity,
            });
        }
    });

    setItems(prevItems => {
        const newItems = [...prevItems];
        itemsToAdd.forEach(itemToAdd => {
            const existingIndex = newItems.findIndex(i => i.id === itemToAdd.id);
            if (existingIndex > -1) {
                newItems[existingIndex].quantity += itemToAdd.quantity;
            } else {
                newItems.push(itemToAdd);
            }
        });
        return newItems;
    });

    toast({ title: "Kit Adicionado!", description: `Os itens do kit "${selectedKit.name}" foram adicionados ao orçamento.` });
  };
  
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };
  
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return handleRemoveItem(itemId);
    setItems(items.map(item => item.id === itemId ? { ...item, quantity } : item));
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustomer.name) {
        toast({ variant: 'destructive', title: 'Nome obrigatório' });
        return;
    }
    const customerToAdd: Customer = { ...newCustomer, id: `CUST-${Date.now()}` };
    const updatedCustomers = [...customers, customerToAdd];
    await saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setSelectedCustomerId(customerToAdd.id);
    setIsAddCustomerOpen(false);
    toast({ title: 'Cliente adicionado!', description: `${customerToAdd.name} foi salvo.` });
  };
  
  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const total = subtotal - discount;

  const handleSaveQuote = () => {
    if (!selectedCustomerId) {
        toast({ variant: "destructive", title: "Cliente não selecionado" });
        return;
    }
    if (items.length === 0) {
        toast({ variant: "destructive", title: "Nenhum item adicionado" });
        return;
    }
    
    const customer = customers.find(c => c.id === selectedCustomerId);

    const finalQuote: Quote = {
        id: quote?.id || `QUOTE-${Date.now()}`,
        date: quote?.date || new Date().toISOString().split('T')[0],
        time: quote?.time || new Date().toLocaleTimeString('pt-BR'),
        user: currentUser?.name || 'Não identificado',
        items,
        subtotal,
        discount,
        total,
        status: quote?.status || 'Pendente',
        validUntil: addDays(new Date(), 3).toISOString().split('T')[0],
        observations,
        customerId: selectedCustomerId,
        customerName: customer?.name,
    };
    onSave(finalQuote);
  };
  
  const generatePdf = async () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) { toast({variant: 'destructive', title: 'Selecione um cliente'}); return; }

    const companyInfo = await getCompanyInfo();
    const doc = new jsPDF();
    
    const performGeneration = (logoImage: HTMLImageElement | null) => {
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
        if (companyInfo?.name) {
            doc.text(companyInfo.name, textX, currentY);
            currentY += 8;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyInfo?.address) {
            doc.text(companyInfo.address, textX, currentY);
            currentY += 4;
        }
        if (companyInfo?.phone || companyInfo?.emailOrSite) {
            doc.text(`Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`, textX, currentY);
        }

        const rightHeaderX = pageWidth - margin;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Orçamento`, rightHeaderX, currentY - 8, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nº: #${(quote?.id || 'NOVO').slice(-6)}`, rightHeaderX, currentY - 2, { align: 'right' });
        doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });
        
        currentY = 50;
        
        // Customer
        const boxWidth = (pageWidth - margin * 2);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, currentY, boxWidth, 7, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Cliente', margin + 3, currentY + 5);
        currentY += 7;

        const customerInfo = {
            'Nome:': customer.name,
            'Telefone:': customer.phone,
            'Documento:': customer.document || "Não informado"
        }
        doc.autoTable({
            body: Object.entries(customerInfo),
            startY: currentY,
            theme: 'grid',
            tableWidth: boxWidth,
            margin: { left: margin },
            styles: { fontSize: 9, cellPadding: 2, lineColor: [200,200,200], lineWidth: 0.1 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
        });
        currentY = doc.lastAutoTable.finalY + 8;
        
        // Items
        doc.autoTable({
            startY: currentY,
            head: [['Descrição', 'Qtd.', 'Vlr. Unit.', 'Subtotal']],
            body: items.map(item => [item.name, item.quantity, `R$ ${item.price.toFixed(2)}`, `R$ ${(item.price * item.quantity).toFixed(2)}`]),
            foot: [
                ['Total Serviços: R$ 0.00', 'Total Peças: R$ 0.00', { content: 'Valor Total Estimado:', styles: { halign: 'right' } }, { content: `R$ ${total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold' },
            footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' }
        });
        currentY = doc.lastAutoTable.finalY + 10;
        
        // Footer terms
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
      img.crossOrigin = "anonymous";
      img.src = companyInfo.logoUrl;
      img.onload = () => performGeneration(img);
      img.onerror = () => {
        console.error("Error loading logo for PDF, proceeding without it.");
        performGeneration(null);
      };
    } else {
      performGeneration(null);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{quote ? `Editar Orçamento #${quote.id.slice(-6)}` : 'Criar Novo Orçamento'}</DialogTitle>
          <DialogDescription>
            Adicione itens e defina os detalhes do orçamento.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                <div className="md:col-span-2 flex flex-col p-4 h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-grow">
                            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Escanear código de barras..." className="pl-10" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()} />
                        </div>
                        <Button variant="outline" onClick={() => setIsManualAddOpen(true)}>Adicionar Item Manual</Button>
                    </div>
                    <div className="border rounded-lg min-h-[300px] flex-grow">
                        <ScrollArea className="h-[calc(100%-2rem)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="w-24 text-center">Qtd.</TableHead>
                                        <TableHead className="w-32 text-right">Preço</TableHead>
                                        <TableHead className="w-32 text-right">Subtotal</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length > 0 ? items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))} className="w-16 h-8 text-center mx-auto" /></TableCell>
                                            <TableCell className="text-right">R$ {(item.price || 0).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="text-center h-48">Nenhum item adicionado.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>
                <div className="md:col-span-1 border-l p-4 flex flex-col gap-4 bg-muted/30 h-full">
                    <div className="space-y-2">
                        <Label htmlFor="customer">Cliente</Label>
                        <div className="flex gap-2">
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}><UserPlus /></Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="kit">Adicionar Kit ao Orçamento</Label>
                      <Select onValueChange={handleAddKit}>
                          <SelectTrigger id="kit">
                              <SelectValue placeholder="Selecione um kit..." />
                          </SelectTrigger>
                          <SelectContent>
                              {kits.map(k => (
                                  <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2 text-base mt-auto">
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><Label htmlFor="discount">Desconto (R$)</Label><Input id="discount" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" /></div>
                        <div className="flex justify-between items-center font-bold text-xl border-t pt-2"><Label>Total</Label><span>R$ {total.toFixed(2)}</span></div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea id="observations" placeholder="Condições, detalhes adicionais, etc." value={observations} onChange={e => setObservations(e.target.value)} rows={4}/>
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter className="p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={generatePdf}><Printer className="mr-2"/>Imprimir PDF</Button>
          <div className="flex-grow" />
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleSaveQuote}>Salvar Orçamento</Button>
        </DialogFooter>

        {/* Add New Customer Dialog */}
        <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-name">Nome</Label>
                        <Input id="new-name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-phone">Telefone</Label>
                        <Input id="new-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsAddCustomerOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveNewCustomer}>Salvar Cliente</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
     <ManualAddItemDialog
        isOpen={isManualAddOpen}
        onAddItem={handleAddItem}
        onOpenChange={setIsManualAddOpen}
    />
    </>
  );
}

    
