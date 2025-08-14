
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
  SidebarProvider,
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
  const { user, isLoading } = useAuth();
  
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  return (
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
  );
}
