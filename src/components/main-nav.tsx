

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ShoppingCart,
  Archive,
  CircleDollarSign,
  Settings,
  Calendar,
  FileText,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { User, UserPermissions } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: keyof UserPermissions;
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'accessDashboard' },
  { href: '/agenda', label: 'Agenda', icon: Calendar, permission: 'accessAgenda' },
  { href: '/clientes', label: 'Clientes', icon: Users, permission: 'accessClients' },
  { href: '/ordens-de-servico', label: 'Ordens de Serviço', icon: Wrench, permission: 'accessServiceOrders' },
  { href: '/produtos', label: 'Produtos', icon: Archive, permission: 'accessInventory' },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart, permission: 'accessSales' },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText, permission: 'accessQuotes' },
  { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign, permission: 'accessFinancials' },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, permission: 'accessSettings' },
];

export function MainNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user: currentUser } = useAuth();
  const isCollapsed = state === 'collapsed';

  const navItems = React.useMemo(() => {
    if (!currentUser || !currentUser.permissions) return [];
    return allNavItems.filter(item => currentUser.permissions[item.permission]);
  }, [currentUser]);

  if (!currentUser) {
    return (
      <nav className="flex flex-col gap-2 px-4 py-4">
          <p className="text-xs text-center text-muted-foreground p-4">
            Faça login para ver o menu.
          </p>
      </nav>
    )
  }

  return (
    <nav className="flex flex-col gap-2 px-4 py-4">
      <TooltipProvider>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-primary/80',
                  isActive && 'bg-primary text-primary-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.label}</span>}
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
      </TooltipProvider>
    </nav>
  );
}
