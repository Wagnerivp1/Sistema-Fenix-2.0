
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAppointments } from '@/lib/storage';
import type { Appointment } from '@/types';
import { format, isToday, parseISO } from 'date-fns';

export function TodayAppointments() {
  const [todaysAppointments, setTodaysAppointments] = React.useState<Appointment[]>([]);

  React.useEffect(() => {
    const loadAppointments = async () => {
      const allAppointments = await getAppointments();
      const today = new Date();
      const filtered = allAppointments
        .filter(appt => isToday(parseISO(appt.start)) && appt.extendedProps.status === 'agendado')
        .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
      setTodaysAppointments(filtered);
    };
    loadAppointments();
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Agendamentos de Hoje</CardTitle>
        <CardDescription>
          Você tem {todaysAppointments.length} agendamento(s) para hoje.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {todaysAppointments.length > 0 ? (
          <div className="space-y-4">
            {todaysAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarFallback>{appt.extendedProps.customerName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{appt.extendedProps.customerName}</p>
                        <p className="text-sm text-muted-foreground">{appt.extendedProps.serviceType}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-medium">{format(parseISO(appt.start), 'HH:mm')}</p>
                    <p className="text-xs text-muted-foreground">{appt.extendedProps.address}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
