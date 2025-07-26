
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAppointments, getCompanyInfo } from '@/lib/storage';
import type { Appointment, CompanyInfo } from '@/types';
import { differenceInMinutes, parseISO } from 'date-fns';

const playNotificationSound = (soundUrl?: string) => {
  if (typeof window === 'undefined') return;

  if (soundUrl) {
    const audio = new Audio(soundUrl);
    audio.play().catch(e => console.error("Error playing custom sound:", e));
    return;
  }
  
  if (!window.AudioContext) return;
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};


export function AppointmentReminder() {
  const { toast } = useToast();
  const notifiedAppointments = React.useRef(new Set<string>());
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
      const info = await getCompanyInfo();
      setCompanyInfo(info);
    };
    fetchCompanyInfo();
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
                  
                  playNotificationSound(companyInfo?.notificationSoundUrl);
                  
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
  }, [toast, companyInfo]);

  return null;
}
