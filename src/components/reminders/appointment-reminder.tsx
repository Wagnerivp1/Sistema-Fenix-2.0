
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAppointments, getCompanyInfo } from '@/lib/storage';
import type { Appointment, CompanyInfo } from '@/types';
import { differenceInMinutes, parseISO } from 'date-fns';
import { ToastAction } from "@/components/ui/toast";

let audio: HTMLAudioElement | null = null;
let oscillator: OscillatorNode | null = null;
let soundTimer: NodeJS.Timeout | null = null;
let audioContext: AudioContext | null = null;

const stopSound = () => {
  if (audio && !audio.paused) {
    audio.loop = false;
    audio.pause();
    audio.currentTime = 0;
  }
  if (oscillator) {
    try {
      oscillator.stop();
    } catch (e) {}
    oscillator.disconnect();
    oscillator = null;
  }
  if(soundTimer) {
      clearTimeout(soundTimer);
      soundTimer = null;
  }
};

const playNotificationSound = (soundUrl?: string, loop: boolean = false) => {
  if (typeof window === 'undefined') return;
  stopSound(); 

  if (soundUrl) {
    if (!audio) {
      audio = new Audio();
    }
    audio.src = soundUrl;
    audio.loop = loop;
    audio.play().catch(e => console.error("Error playing custom sound:", e));
    return;
  }
  
  if (!window.AudioContext) return;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }

  const playTone = () => {
    // Check if sound was stopped
    if (!oscillator && loop) return;
    
    // Ensure we are in a state to play
    if (!audioContext) return;
    
    if(oscillator) {
      try { oscillator.stop(); } catch(e) {}
      oscillator.disconnect();
    }

    oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    if (loop) {
        soundTimer = setTimeout(playTone, 800);
    }
  };
  
  if(loop) {
    oscillator = new AudioContext().createOscillator(); // Prime it
  }
  playTone();
};


export function AppointmentReminder() {
  const { toast, dismiss } = useToast();
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
                  
                  playNotificationSound(companyInfo?.notificationSoundUrl, true);

                  const { id } = toast({
                    title: `🔔 ${title}`,
                    description: description,
                    duration: Infinity,
                    onOpenChange: (open) => {
                        if (!open) {
                            stopSound();
                        }
                    },
                    action: (
                      <ToastAction altText="Silenciar" onClick={() => {
                        stopSound();
                        dismiss(id);
                      }}>
                        Silenciar
                      </ToastAction>
                    ),
                  });
                                    
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

    const initialCheckTimeout = setTimeout(() => {
        checkAppointments(); // Initial check after a short delay
        const intervalId = setInterval(checkAppointments, 60000); // Subsequent checks every minute

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, 2000); // 2-second delay

    // Cleanup for the timeout if the component unmounts before it fires
    return () => clearTimeout(initialCheckTimeout);
  }, [toast, companyInfo, dismiss]);

  return null;
}
