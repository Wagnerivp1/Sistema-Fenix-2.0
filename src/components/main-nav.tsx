
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
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { getLoggedInUser } from '@/lib/storage';
import type { User } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: User['role'][];
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'technician', 'sales', 'normal', 'receptionist'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'technician', 'sales', 'receptionist'] },
  { href: '/ordens-de-servico', label: 'Ordens de Serviço', icon: Wrench, roles: ['admin', 'technician', 'receptionist'] },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart, roles: ['admin', 'sales', 'normal', 'receptionist'] },
  { href: '/estoque', label: 'Estoque', icon: Archive, roles: ['admin', 'technician', 'sales', 'receptionist'] },
  { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign, roles: ['admin'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
];

export function MainNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    setCurrentUser(getLoggedInUser());
  }, []);

  const navItems = React.useMemo(() => {
    if (!currentUser) return [];
    return allNavItems.filter(item => item.roles.includes(currentUser.role));
  }, [currentUser]);

  if (!currentUser) {
    return (
        <nav className="flex flex-col gap-2 px-4 py-4">
            {/* You can add a skeleton loader here */}
        </nav>
    );
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
