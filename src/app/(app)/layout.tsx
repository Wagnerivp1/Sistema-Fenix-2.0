
'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MainNav } from '@/components/main-nav';
import { Logo } from '@/components/logo';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getLoggedInUser } from '@/lib/storage';

const HeaderActions = dynamic(() => import('@/components/layout/header-actions').then(mod => mod.HeaderActions), {
  ssr: false,
  loading: () => <Skeleton className="h-8 w-8 rounded-full" />,
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = React.useState(false);

  React.useEffect(() => {
    const user = getLoggedInUser();
    if (!user) {
      router.replace('/');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  if (!isVerified) {
    // Render a skeleton or loading state while verifying authentication
    // This prevents a flash of the old page content
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
              </Link>
            </div>
            <div className="flex-1">
              <MainNav />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
             <div className="flex items-center gap-4">
                 <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Wrench className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col">
                      <nav className="grid gap-2 text-lg font-medium">
                        <MainNav />
                      </nav>
                    </SheetContent>
                  </Sheet>
             </div>
            
            <div className="absolute left-1/2 -translate-x-1/2">
                <Logo />
            </div>

            <div>
              <HeaderActions />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
