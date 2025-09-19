'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCustomers, getServiceOrders, getCompanyInfo } from '@/lib/storage';
import type { Customer, ServiceOrder, CompanyInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Printer, User, HardDrive } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const loadImageAsDataUrl = async (url: string | undefined): Promise<string | null> => {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => {
      console.warn(`Could not load image from: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
};

export default function LaudosPage() {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [laudoText, setLaudoText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [customersData, ordersData] = await Promise.all([getCustomers(), getServiceOrders()]);
      setCustomers(customersData);
      setServiceOrders(ordersData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedOrderId(null);
    setLaudoText('');
  };

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = serviceOrders.find(o => o.id === orderId);
    // Pre-fill laudo text with technical report if it exists
    setLaudoText(order?.technicalReport || '');
  };

  const filteredOrders = React.useMemo(() => {
    if (!selectedCustomerId) return [];
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return [];
    return serviceOrders.filter(o => o.customerName === customer.name);
  }, [selectedCustomerId, customers, serviceOrders]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedOrder = serviceOrders.find(o => o.id === selectedOrderId);

  const generatePdf = async () => {
    if (!selectedCustomer || !selectedOrder) {
      toast({
        variant: 'destructive',
        title: 'Dados Incompletos',
        description: 'Selecione um cliente e uma ordem de serviço para gerar o laudo.',
      });
      return;
    }

    const companyInfo = await getCompanyInfo();
    const logoDataUrl = await loadImageAsDataUrl(companyInfo.logoUrl);
    const generationDate = new Date();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;
    let textX = margin;

    // Header
    if (logoDataUrl) {
      const logoWidth = 30;
      const logoHeight = 30;
      doc.addImage(logoDataUrl, 'PNG', margin, currentY - 8, logoWidth, logoHeight);
      textX = margin + logoWidth + 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(companyInfo.name || 'Laudo Técnico', textX, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
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
    doc.text('Laudo Técnico', rightHeaderX, currentY - 8, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`OS Nº: #${selectedOrder.id.slice(-4)}`, rightHeaderX, currentY - 2, { align: 'right' });
    doc.text(`Data Emissão: ${generationDate.toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });


    currentY = 55;
    doc.setLineWidth(0.5);
    doc.line(margin, currentY - 5, pageWidth - margin, currentY - 5);

    // Customer and Equipment Info
    const boxWidth = (pageWidth - margin * 2 - 5) / 2;

    const drawInfoBox = (title: string, data: { [key: string]: string }, x: number, y: number, width: number) => {
      doc.setFillColor(243, 244, 246);
      doc.rect(x, y, width, 7, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x + 3, y + 5);

      const tableBody = Object.entries(data).map(([key, value]) => [key, value]);
      (doc as any).autoTable({
        body: tableBody,
        startY: y + 7,
        theme: 'grid',
        tableWidth: width,
        margin: { left: x },
        styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } },
      });
      return (doc as any).lastAutoTable.finalY;
    };

    const clientData = {
      'Nome:': selectedCustomer.name,
      'CPF/CNPJ:': selectedCustomer.document || 'Não informado',
      'Telefone:': selectedCustomer.phone || 'Não informado',
      'Endereço:': selectedCustomer.address || 'Não informado',
    };
    
    const equipmentName = typeof selectedOrder.equipment === 'string' 
          ? selectedOrder.equipment 
          : `${selectedOrder.equipment.type} ${selectedOrder.equipment.brand} ${selectedOrder.equipment.model}`;

    const equipmentData = {
      'Equipamento:': equipmentName,
      'Nº Série:': selectedOrder.serialNumber || 'Não informado',
      'Data Entrada:': new Date(selectedOrder.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      'Defeito Relatado:': selectedOrder.reportedProblem || 'Não informado',
    };

    const clientBoxHeight = drawInfoBox('Dados do Cliente', clientData, margin, currentY, boxWidth);
    const equipmentBoxHeight = drawInfoBox('Informações do Equipamento', equipmentData, margin + boxWidth + 5, currentY, boxWidth);
    currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 10;

    // Laudo Técnico Content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ANÁLISE TÉCNICA', margin, currentY);
    currentY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const laudoLines = doc.splitTextToSize(laudoText, pageWidth - margin * 2);
    doc.text(laudoLines, margin, currentY);
    currentY += (doc.getTextDimensions(laudoLines).h) + 20;
    
    // --- Footer with Date, Location and Signature ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const city = companyInfo.address?.split('-')[0]?.split(',')[1]?.trim() || '____________';
    const emissionDateTime = `${city}, ${generationDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${generationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    doc.text(emissionDateTime, pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;

    doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
    currentY += 5;
    
    doc.setFontSize(10);
    doc.text(currentUser?.name || 'Técnico Responsável', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.setFontSize(8);
    doc.text(companyInfo.name || '', pageWidth / 2, currentY, { align: 'center' });


    doc.output('dataurlnewwindow');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Laudos Técnicos</CardTitle>
        <CardDescription>
          Selecione o cliente e a ordem de serviço para gerar um laudo técnico detalhado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="customer-select">1. Selecione o Cliente</Label>
            <Select onValueChange={handleCustomerChange} value={selectedCustomerId || ''}>
              <SelectTrigger id="customer-select" disabled={isLoading}>
                <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-select">2. Selecione a Ordem de Serviço</Label>
            <Select onValueChange={handleOrderChange} value={selectedOrderId || ''} disabled={!selectedCustomerId || filteredOrders.length === 0}>
              <SelectTrigger id="order-select">
                <SelectValue placeholder={!selectedCustomerId ? 'Aguardando cliente...' : filteredOrders.length === 0 ? 'Nenhuma OS encontrada' : 'Selecione a OS...'} />
              </SelectTrigger>
              <SelectContent>
                {filteredOrders.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    OS #{o.id.slice(-4)} - {typeof o.equipment === 'string' ? o.equipment : o.equipment.type} - {new Date(o.date).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCustomer && selectedOrder && (
          <div className="p-4 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.document || 'Documento não informado'}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
               <HardDrive className="h-5 w-5 text-muted-foreground mt-1" />
               <div>
                  <p className="font-semibold">{typeof selectedOrder.equipment === 'string' ? selectedOrder.equipment : `${selectedOrder.equipment.type} ${selectedOrder.equipment.brand}`}</p>
                  <p className="text-sm text-muted-foreground">OS #{selectedOrder.id.slice(-4)}</p>
                  <p className="text-sm text-muted-foreground">Entrada: {new Date(selectedOrder.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="laudo-text">3. Conteúdo do Laudo Técnico</Label>
          <Textarea
            id="laudo-text"
            rows={15}
            placeholder="Digite aqui a análise técnica, os procedimentos realizados, as peças trocadas e a conclusão do laudo..."
            value={laudoText}
            onChange={e => setLaudoText(e.target.value)}
            disabled={!selectedOrderId}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={generatePdf} disabled={!laudoText.trim()}>
            <Printer className="mr-2 h-4 w-4" />
            Gerar e Visualizar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
