
'use client';

import * as React from 'react';
import type { ServiceOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileDown, Calendar, User, Wrench, HardDrive, HelpCircle, FileText, ShoppingBag, DollarSign, ShieldCheck, MessageSquare, Tag } from 'lucide-react';
import { Badge } from '../ui/badge';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
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
    doc.text(`Histórico de Atendimentos - ${customerName}`, 14, 15);
    
    let yPosition = 25;
    
    history.forEach((order, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`OS #${order.id.slice(-4)} - ${formatDate(order.date)} - Status: ${order.status}`, 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Equipamento: ${order.equipment}`, 16, yPosition);
      yPosition += 5;
      doc.text(`Problema Relatado: ${order.reportedProblem}`, 16, yPosition);
      yPosition += 5;
      doc.text(`Laudo Técnico: ${order.technicalReport || 'Não informado'}`, 16, yPosition);
      yPosition += 10;
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
