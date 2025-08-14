

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

import { cn } from '@/lib/utils';
import { useSidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
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
  const { user: currentUser } = useAuth();

  const navItems = React.useMemo(() => {
    if (!currentUser || !currentUser.permissions) return [];
    return allNavItems.filter(item => currentUser.permissions[item.permission]);
  }, [currentUser]);

  if (!currentUser) {
    return (
        <div className="flex flex-col gap-2 px-4 py-4">
            <p className="text-xs text-center text-muted-foreground p-4">
                Faça login para ver o menu.
            </p>
        </div>
    )
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && (item.href !== '/produtos' || pathname === '/produtos' || pathname.startsWith('/produtos/kits'));
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
      </SidebarMenu>
  );
}
