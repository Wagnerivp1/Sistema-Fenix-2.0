
'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  CircleUser,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/main-nav';
import { Logo } from '@/components/logo';
import { HeaderActions } from '@/components/layout/header-actions';
import { AppointmentReminder } from '@/components/reminders/appointment-reminder';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isVerified, setIsVerified] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      router.replace('/');
    } else {
      setIsVerified(true);
    }
  }, [user, router]);

  if (!isVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  return (
      <Sidebar>
        <AppointmentReminder />
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
            <MainNav />
        </SidebarContent>
        <SidebarFooter>
             <HeaderActions />
        </SidebarFooter>
        <SidebarInset>{children}</SidebarInset>
      </Sidebar>
  );
}
