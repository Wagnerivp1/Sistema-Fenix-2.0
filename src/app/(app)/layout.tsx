
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
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
  const pathname = usePathname();
  const isLoginPage = pathname === '/';
  
  if (isLoginPage) {
    return <>{children}</>;
  }
  
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
        <div className="flex flex-col flex-1">
            <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30 md:hidden">
              <SidebarTrigger />
              <div className="flex-1 text-center">
                <Logo />
              </div>
            </header>
            <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
