
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Logo } from '@/components/logo';
import { HeaderActions } from '@/components/layout/header-actions';
import { AppointmentReminder } from '@/components/reminders/appointment-reminder';
import { getSessionToken, removeSessionToken } from '@/lib/storage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = React.useState(false);

  React.useEffect(() => {
    const checkToken = async () => {
      const token = await getSessionToken();
      if (!token) {
        router.replace('/');
      } else {
        setIsVerified(true);
      }
    };
    checkToken();
  }, [router]);

  if (!isVerified) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Verificando sessão...</p>
        </div>
    );
  }

  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  // O AuthGuard agora está fora do AppLayout para envolver tudo
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppointmentReminder />
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <HeaderActions />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
