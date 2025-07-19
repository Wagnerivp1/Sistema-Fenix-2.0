
'use client';

import * as React from 'react';
import type { ServiceOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileDown, Calendar, User, Wrench, HardDrive, HelpCircle, FileText, ShoppingBag, DollarSign, ShieldCheck, MessageSquare, Tag, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { add, parseISO } from 'date-fns';


declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
    }
}


const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
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

export function ServiceHistory({ history }: ServiceHistoryProps) {
  
  const exportToPdf = () => {
    const doc = new jsPDF();
    const customerName = history[0]?.customerName || "Cliente";

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const fontColor = '#000000';
    const primaryColor = '#e0e7ff';
    const secondaryColor = '#f3f4f6';
    let currentY = 40;

    // Cabeçalho da Empresa e do Documento
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
    doc.text(`Histórico de Atendimentos`, pageWidth - margin, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${customerName}`, pageWidth - margin, 24, { align: 'right' });
    doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 29, { align: 'right' });


    const checkPageBreak = (yPosition: number, requiredSpace: number = 20) => {
        if (yPosition > doc.internal.pageSize.getHeight() - requiredSpace) {
            doc.addPage();
            return 20; // Nova posição Y na nova página
        }
        return yPosition;
    };

    history.forEach((order, index) => {
        currentY = checkPageBreak(currentY, 60);

        // Separador para cada OS
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;

        // Título da OS
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`OS #${order.id.slice(-4)} | Data: ${formatDate(order.date)} | Status: ${order.status}`, margin, currentY);
        currentY += 6;

        // Função para desenhar caixas de informação
        const drawInfoBox = (title: string, content: string, startY: number) => {
            const textLines = doc.splitTextToSize(content, pageWidth - margin * 2 - 4);
            const boxHeight = doc.getTextDimensions(textLines).h + 8;
            currentY = checkPageBreak(startY, boxHeight + 5);

            doc.setFillColor(primaryColor);
            doc.rect(margin, startY, pageWidth - margin * 2, 6, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(fontColor);
            doc.text(title, margin + 2, startY + 4.5);

            doc.setDrawColor(primaryColor);
            doc.rect(margin, startY + 6, pageWidth - margin * 2, boxHeight, 'S');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(textLines, margin + 2, startY + 11);

            return startY + boxHeight + 8;
        };
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Equipamento: `, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${order.equipment}${order.serialNumber ? ` (S/N: ${order.serialNumber})` : ''}`, margin + 28, currentY);
        currentY += 6;

        currentY = drawInfoBox('Problema Relatado', order.reportedProblem || 'Não informado', currentY);
        currentY = drawInfoBox('Diagnóstico / Laudo Técnico', order.technicalReport || 'Não informado', currentY);
        
        currentY = checkPageBreak(currentY, 30);
        // Tabela de itens
        if (order.items && order.items.length > 0) {
            doc.autoTable({
                startY: currentY,
                head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
                body: order.items.map(item => [item.type === 'part' ? 'Peça' : 'Serviço', item.description, item.quantity, `R$ ${item.unitPrice.toFixed(2)}`, `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`]),
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: fontColor, fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                margin: { left: margin, right: margin }
            });
            currentY = doc.lastAutoTable.finalY + 5;
        }

        // Valor total da OS
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Valor Total da OS: R$ ${order.totalValue.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 10;
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Histórico de Atendimentos</CardTitle>
          <CardDescription>{history.length} registro(s) encontrado(s).</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportToPdf}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {history.map((order) => (
            <AccordionItem value={order.id} key={order.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-left">
                        {order.equipment}
                      </p>
                      <p className="text-sm text-muted-foreground text-left">
                        OS #{order.id.slice(-4)} - {formatDate(order.date)}
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
                  <InfoItem icon={HardDrive} label="Equipamento" value={`${order.equipment}${order.serialNumber ? ` (S/N: ${order.serialNumber})` : ''}`} />
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
                           <span className="w-24 font-medium text-right">R$ {item.unitPrice.toFixed(2)}</span>
                         </div>
                       ))}
                       <div className="flex justify-end items-center p-2 font-bold text-sm bg-muted/50 rounded-b-md">
                          Total de Itens: R$ {order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0).toFixed(2)}
                       </div>
                     </div>
                   </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4 mt-2 border-t border-dashed">
                  <InfoItem icon={DollarSign} label="Valor Total da OS" value={`R$ ${order.totalValue.toFixed(2)}`} />
                  <InfoItem icon={Tag} label="Forma de Pagamento" value={order.paymentMethod || 'Não informado'} />
                  <InfoItem icon={ShieldCheck} label="Garantia Aplicada" value={order.warranty || 'Não informado'} />
                  <WarrantyInfo order={order} />
                  <InfoItem icon={MessageSquare} label="Observações Internas" value={order.internalNotes || 'Nenhuma'} />
                </div>

              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
  const getWarrantyInfo = () => {
    if (order.status !== 'Entregue' || !order.deliveredDate || !order.warranty || order.warranty.toLowerCase().includes('sem garantia')) {
      return { text: "Garantia pendente de entrega do equipamento.", icon: AlertCircle };
    }
    
    const SETTINGS_KEY = 'app_settings';
    let defaultWarrantyDays = 90; // Default fallback

    try {
        const savedSettings = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
        if (savedSettings) {
            defaultWarrantyDays = JSON.parse(savedSettings).defaultWarrantyDays || 90;
        }
    } catch (e) {
        console.error("Could not parse warranty settings, using default.", e);
    }
    
    const match = order.warranty.match(/(\d+)\s*(dias|meses|mes|ano|anos)/i);
    let duration: Duration = { days: defaultWarrantyDays };

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('dia')) duration = { days: value };
      else if (unit.startsWith('mes')) duration = { months: value };
      else if (unit.startsWith('ano')) duration = { years: value };
    }

    const startDate = parseISO(order.deliveredDate);
    const endDate = add(startDate, duration);
    
    return {
      text: `Início: ${formatDate(order.deliveredDate)} | Fim: ${formatDate(endDate.toISOString())}`,
      icon: ShieldCheck
    };
  }
  
  const warranty = getWarrantyInfo();

  return <InfoItem icon={warranty.icon} label="Período de Garantia" value={warranty.text} />
};
