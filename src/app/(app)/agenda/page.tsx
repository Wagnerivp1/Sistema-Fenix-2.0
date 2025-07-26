
'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PlusCircle, Calendar as CalendarIcon, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAppointments, saveAppointments, getCustomers } from '@/lib/storage';
import type { Appointment, Customer } from '@/types';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';

export default function AgendaPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Partial<Appointment> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [appointmentsData, customersData] = await Promise.all([
        getAppointments(),
        getCustomers(),
      ]);
      setAppointments(appointmentsData);
      setCustomers(customersData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      extendedProps: { status: 'agendado' }
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      extendedProps: {
        customerId: event.extendedProps.customerId,
        customerName: event.extendedProps.customerName,
        address: event.extendedProps.address,
        serviceType: event.extendedProps.serviceType,
        notes: event.extendedProps.notes,
        status: event.extendedProps.status,
      },
    });
    setIsDialogOpen(true);
  };
  
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    const updatedAppointment: Appointment = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      extendedProps: event.extendedProps as Appointment['extendedProps'],
    };
    const updatedAppointments = appointments.map(appt => appt.id === updatedAppointment.id ? updatedAppointment : appt);
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    toast({ title: 'Compromisso reagendado!', description: `O compromisso foi movido para a nova data.` });
  }

  const handleSaveAppointment = async () => {
    if (!selectedEvent || !selectedEvent.extendedProps) return;

    const { customerId, serviceType } = selectedEvent.extendedProps;
    const customer = customers.find(c => c.id === customerId);

    if (!customer || !serviceType) {
      toast({ variant: 'destructive', title: 'Dados incompletos', description: 'Por favor, selecione um cliente e o tipo de serviço.' });
      return;
    }

    const newOrUpdatedAppointment: Appointment = {
      id: selectedEvent.id || `APT-${Date.now()}`,
      title: `${customer.name} - ${serviceType}`,
      start: selectedEvent.start!,
      end: selectedEvent.end!,
      allDay: selectedEvent.allDay!,
      extendedProps: {
        ...selectedEvent.extendedProps,
        customerName: customer.name,
        address: selectedEvent.extendedProps.address || customer.address
      },
    };

    let updatedAppointments;
    if (selectedEvent.id) {
      updatedAppointments = appointments.map(appt => appt.id === newOrUpdatedAppointment.id ? newOrUpdatedAppointment : appt);
    } else {
      updatedAppointments = [...appointments, newOrUpdatedAppointment];
    }
    
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    
    toast({ title: 'Compromisso salvo!', description: 'O agendamento foi salvo com sucesso.' });
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>Gerencie seus compromissos e agendamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>Carregando agenda...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agenda Técnica</CardTitle>
              <CardDescription>
                Gerencie seus compromissos e chamados externos. Clique em uma data para adicionar um evento.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => handleDateSelect({ startStr: new Date().toISOString(), endStr: '', allDay: true, view: {} as any })}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[600px] text-sm">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView="dayGridMonth"
              locale="pt-br"
              buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
              }}
              events={appointments}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              editable={true}
              droppable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.id ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Preencha os detalhes do compromisso.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Select
                value={selectedEvent?.extendedProps?.customerId}
                onValueChange={(value) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, customerId: value}}))}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
              <Input
                id="serviceType"
                placeholder="Ex: Manutenção de impressora"
                value={selectedEvent?.extendedProps?.serviceType || ''}
                onChange={(e) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, serviceType: e.target.value}}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço do Atendimento</Label>
              <Input
                id="address"
                placeholder="Preenchido automaticamente pelo cliente ou informe um novo."
                value={selectedEvent?.extendedProps?.address || customers.find(c=>c.id === selectedEvent?.extendedProps?.customerId)?.address || ''}
                onChange={(e) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, address: e.target.value}}))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input type="datetime-local" value={selectedEvent?.start?.slice(0,16)} onChange={e => setSelectedEvent(p => ({ ...p, start: e.target.value }))} />
                </div>
                 <div className="space-y-2">
                    <Label>Data de Fim</Label>
                    <Input type="datetime-local" value={selectedEvent?.end?.slice(0,16)} onChange={e => setSelectedEvent(p => ({ ...p, end: e.target.value }))} />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Anotações Adicionais</Label>
              <Textarea
                id="notes"
                placeholder="Detalhes importantes, pontos de referência, etc."
                value={selectedEvent?.extendedProps?.notes || ''}
                onChange={(e) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, notes: e.target.value}}))}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveAppointment}>Salvar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
