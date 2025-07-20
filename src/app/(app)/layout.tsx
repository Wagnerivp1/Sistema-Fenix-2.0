
'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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

const HeaderActions = dynamic(() => import('@/components/layout/header-actions').then(mod => mod.HeaderActions), {
  ssr: false,
  loading: () => <Skeleton className="h-8 w-8 rounded-full" />,
});


export default function AppLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Logo />
              </Link>
            </div>
            <div className="flex-1">
              <MainNav />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Wrench className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                  <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <Logo />
                  </Link>
                  <MainNav />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              {/* Can add search bar here if needed */}
            </div>
            <HeaderActions />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
