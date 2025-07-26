
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAppointments } from '@/lib/storage';
import type { Appointment } from '@/types';
import { differenceInMinutes, parseISO } from 'date-fns';

export function AppointmentReminder() {
  const { toast } = useToast();
  const notifiedAppointments = React.useRef(new Set<string>());
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    // Pre-load the audio element to improve reliability
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.playsInline = true;
    }
  }, []);

  React.useEffect(() => {
    const checkAppointments = async () => {
      try {
        const appointments = await getAppointments();
        const now = new Date();

        for (const appt of appointments) {
          if (appt.extendedProps.status === 'agendado') {
            const startTime = parseISO(appt.start);

            if (startTime > now) {
              const minutesUntilStart = differenceInMinutes(startTime, now);
              
              const reminderIntervals = [30, 15, 5, 0];

              for (const interval of reminderIntervals) {
                const notificationId = `${appt.id}-${interval}`;

                if (minutesUntilStart <= interval && !notifiedAppointments.current.has(notificationId)) {
                  
                  let title: string;
                  if (interval > 0) {
                    title = `Lembrete: Atendimento em ${interval} minutos`;
                  } else {
                    title = `Lembrete: Atendimento Agora`;
                  }

                  const description = (
                    <div>
                      <p><b>Cliente:</b> {appt.extendedProps.customerName}</p>
                      <p><b>Serviço:</b> {appt.extendedProps.serviceType}</p>
                      <p><b>Horário:</b> {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      {appt.extendedProps.address && <p><b>Endereço:</b> {appt.extendedProps.address}</p>}
                      {appt.extendedProps.notes && <p><b>Obs:</b> {appt.extendedProps.notes}</p>}
                    </div>
                  );
                  
                  toast({
                    title: `🔔 ${title}`,
                    description: description,
                    duration: 20000, 
                  });

                  if (audioRef.current) {
                    audioRef.current.currentTime = 0; // Rewind to the start
                    audioRef.current.play().catch(error => {
                      console.error("Audio playback failed. This may be due to browser autoplay restrictions.", error);
                    });
                  }
                  
                  notifiedAppointments.current.add(notificationId);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to check appointments:", error);
      }
    };

    const intervalId = setInterval(checkAppointments, 60000); // Check every minute
    checkAppointments();

    return () => clearInterval(intervalId);
  }, [toast]);

  return null;
}
