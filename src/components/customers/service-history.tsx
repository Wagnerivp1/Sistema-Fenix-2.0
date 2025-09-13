
'use client';

import * as React from 'react';
import type { ServiceOrder, CompanyInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileDown, Calendar, User, Wrench, HardDrive, HelpCircle, FileText, ShoppingBag, DollarSign, ShieldCheck, MessageSquare, Tag, AlertCircle, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import { add, isValid, parseISO } from 'date-fns';
import { Input } from '../ui/input';
import { getCompanyInfo, getSettings } from '@/lib/storage';


const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data inválida';
    
    // Create a date object. This is more robust than assuming a format.
    const date = new Date(dateString);

    // Check if the date is valid.
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }

    // Format the valid date, ensuring UTC to prevent timezone shifts.
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
};

const getEquipmentName = (equipment: any): string => {
  if (typeof equipment === 'string') {
    return equipment;
  }
  if (typeof equipment === 'object' && equipment !== null) {
    return `${equipment.type || ''} ${equipment.brand || ''} ${equipment.model || ''}`.trim();
  }
  return 'Equipamento não identificado';
};

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

interface ServiceHistoryProps {
  history: ServiceOrder[];
}

const loadImageAsDataUrl = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = '/images/pdf-logos/logo.png';
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
      console.warn(`Logo para PDF não encontrada em: /images/pdf-logos/logo.png`);
      resolve(null);
    };
  });
};

export function ServiceHistory({ history }: ServiceHistoryProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredHistory = history.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase().replace(/\s+/g, ''))
  );

  const exportToPdf = async () => {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const companyInfo = await getCompanyInfo();
    const customerName = (filteredHistory[0] as any)?.customerName || (filteredHistory[0] as any)?.client?.name || "Cliente";
    
    const logoDataUrl = await loadImageAsDataUrl();
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;
    const fontColor = '#000000';
    let textX = margin;
    const logoWidth = 30;
    const logoHeight = 30;
    const logoSpacing = 5;

    if (logoDataUrl) {
      (doc as any).addImage(logoDataUrl, 'PNG', margin, currentY - 8, logoWidth, logoHeight);
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
    doc.text(`Histórico de Atendimentos`, rightHeaderX, currentY - 8, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${customerName}`, rightHeaderX, currentY - 2, { align: 'right' });
    doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });

    currentY = 50;

    const checkPageBreak = (yPosition: number, requiredSpace: number = 20) => {
      if (yPosition > doc.internal.pageSize.getHeight() - requiredSpace) {
        doc.addPage();
        return 20;
      }
      return yPosition;
    };

    filteredHistory.forEach((order, index) => {
      if (index > 0) {
        currentY += 5;
        doc.setLineDashPattern([1, 2], 0);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        doc.setLineDashPattern([], 0);
        currentY += 10;
      }

      currentY = checkPageBreak(currentY, 60);

      doc.setFillColor(243, 244, 246);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 7, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Ordem de Serviço #${order.id.slice(-4)}`, margin + 2, currentY + 5);
      
      doc.setFontSize(10);
      doc.text(`Status: ${order.status}`, pageWidth - margin - 2, currentY + 5, { align: 'right' });
      currentY += 12;
      
      const boxWidth = (pageWidth - margin * 2 - 5) / 2;

      const clientData = {
        'Data de Entrada:': formatDate(order.date),
        'Atendente:': order.attendant || "Não informado",
      };

      const equipmentName = getEquipmentName(order.equipment);
      const equipmentData = {
          'Equipamento:': equipmentName,
          'Nº Série:': order.serialNumber || 'Não informado',
          'Acessórios:': order.accessories || 'Nenhum'
      }
      
      const drawInfoBox = (data: { [key: string]: string }, x: number, y: number, width: number) => {
          const tableBody = Object.entries(data).map(([key, value]) => [key, value]);
          (doc as any).autoTable({
              body: tableBody,
              startY: y,
              theme: 'grid',
              tableWidth: width,
              margin: { left: x },
              styles: { fontSize: 8.5, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
              columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } }
          });
          return (doc as any).lastAutoTable.finalY;
      }

      const clientBoxHeight = drawInfoBox(clientData, margin, currentY, boxWidth);
      const equipmentBoxHeight = drawInfoBox(equipmentData, margin + boxWidth + 5, currentY, boxWidth);
      currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 5;


      if (order.items && order.items.length > 0) {
        (doc as any).autoTable({
          startY: currentY,
          head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
          body: order.items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${(item.unitPrice || 0).toFixed(2)}`, `R$ ${((item.unitPrice || 0) * item.quantity).toFixed(2)}`]),
          theme: 'striped',
          headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
          bodyStyles: { fontSize: 8, cellPadding: 1.5 },
          footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' },
          foot: [
              ['Total', '', '', '', `R$ ${(order.totalValue || 0).toFixed(2)}`]
          ],
          margin: { left: margin, right: margin }
        });
        currentY = (doc as any).lastAutoTable.finalY + 5;
      }
    });

    doc.save(`Historico_${customerName.replace(/\s+/g, '_')}.pdf`);
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atendimentos</CardTitle>
          <CardDescription>Nenhum atendimento registrado para este cliente.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[250px]">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Este cliente ainda não possui ordens de serviço.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Histórico de Atendimentos</CardTitle>
            <CardDescription>{filteredHistory.length} de {history.length} registro(s) encontrado(s).</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Filtrar por nº OS..."
                className="w-full rounded-lg bg-background pl-8 sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToPdf} disabled={filteredHistory.length === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredHistory.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredHistory.map((order) => {
              const equipmentName = getEquipmentName(order.equipment);
              return (
              <AccordionItem value={order.id} key={order.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-left">
                          {equipmentName}
                        </p>
                        <p className="text-sm text-muted-foreground text-left">
                          OS #{order.id.slice(-4)} - {formatDate(order.date || (order as any).entryDate)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('font-semibold', getStatusVariant(order.status))}>
                      {order.status}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 px-2 space-y-4 bg-muted/30 rounded-md border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4">
                    <InfoItem icon={User} label="Atendente" value={order.attendant} />
                    <InfoItem icon={HardDrive} label="Equipamento" value={`${equipmentName}${order.serialNumber ? ` (S/N: ${order.serialNumber})` : ''}`} />
                    <InfoItem icon={Tag} label="Tipo de Atendimento" value="Manutenção Corretiva" />
                    <InfoItem icon={ShoppingBag} label="Acessórios" value={order.accessories || 'Nenhum'} />
                  </div>
                  
                  <div className="px-4 space-y-4">
                      <InfoBlock icon={HelpCircle} title="Problema Relatado pelo Cliente" content={order.reportedProblem} />
                      <InfoBlock icon={Wrench} title="Diagnóstico / Laudo Técnico Realizado" content={order.technicalReport || 'Não informado'} />
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                     <div className="px-4">
                       <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Peças e Serviços Utilizados</h4>
                       <div className="border rounded-md bg-background/50">
                         {order.items.map(item => (
                           <div key={item.id} className="flex justify-between items-center p-2 border-b last:border-b-0 text-xs">
                             <span className="flex-1">{item.description} ({item.type === 'part' ? 'Peça' : 'Serviço'})</span>
                             <span className="w-20 text-right">Qtd: {item.quantity}</span>
                             <span className="w-24 font-medium text-right">R$ {(item.unitPrice || 0).toFixed(2)}</span>
                           </div>
                         ))}
                         <div className="flex justify-end items-center p-2 font-bold text-sm bg-muted/50 rounded-b-md">
                            Total de Itens: R$ {order.items.reduce((acc, item) => acc + (item.unitPrice || 0) * item.quantity, 0).toFixed(2)}
                         </div>
                       </div>
                     </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4 mt-2 border-t border-dashed">
                    <InfoItem icon={DollarSign} label="Valor Total da OS" value={`R$ ${(order.totalValue || 0).toFixed(2)}`} />
                    <InfoItem icon={Tag} label="Forma de Pagamento" value={order.paymentMethod || 'Não informado'} />
                    <WarrantyInfo order={order} />
                    <InfoItem icon={MessageSquare} label="Observações Internas" value={Array.isArray(order.internalNotes) ? `${order.internalNotes.length} anotação(ões)` : (order.internalNotes || 'Nenhuma')} />
                  </div>

                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-4 min-h-[250px]">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">Tente um número de OS diferente ou limpe a busca.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
    <div>
      <p className="font-semibold text-card-foreground">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  </div>
);

const InfoBlock = ({ icon: Icon, title, content }: { icon: React.ElementType, title: string, content: string }) => (
  <div>
    <h4 className="font-semibold mb-1 flex items-center gap-2 text-card-foreground"><Icon className="h-4 w-4 text-primary" /> {title}</h4>
    <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-md border leading-relaxed">{content}</p>
  </div>
);

const WarrantyInfo = ({ order }: { order: ServiceOrder }) => {
  const [warrantyInfoText, setWarrantyInfoText] = React.useState("Garantia pendente de entrega do equipamento.");

  React.useEffect(() => {
    const fetchSettings = async () => {
      if (order.status !== 'Entregue' || !order.deliveredDate || !order.warranty || order.warranty.toLowerCase().includes('sem garantia')) {
        setWarrantyInfoText("Garantia pendente ou não aplicável.");
        return;
      }
      
      const startDate = parseISO(order.deliveredDate);
      if (!isValid(startDate)) {
          setWarrantyInfoText("Data de entrega inválida.");
          return;
      }

      const settings = await getSettings();
      let defaultWarrantyDays = settings?.defaultWarrantyDays || 90;
      
      const match = order.warranty.match(/(\d+)\s*(dias|meses|mes|ano|anos)/i);
      let duration: Duration = { days: defaultWarrantyDays };

      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        
        if (unit.startsWith('dia')) duration = { days: value };
        else if (unit.startsWith('mes')) duration = { months: value };
        else if (unit.startsWith('ano')) duration = { years: value };
      }

      const endDate = add(startDate, duration);
      
      const text = `Início: ${formatDate(order.deliveredDate)} | Fim: ${formatDate(endDate.toISOString().split('T')[0])}`;
      setWarrantyInfoText(text);
    };

    fetchSettings();
  }, [order]);
  
  const warrantyIcon = warrantyInfoText.startsWith("Garantia pendente") ? AlertCircle : ShieldCheck;

  return <InfoItem icon={warrantyIcon} label="Período de Garantia" value={warrantyInfoText} />
};

    