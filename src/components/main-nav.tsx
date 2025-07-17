'use client';

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

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/ordens-de-servico', label: 'Ordens de Serviço', icon: Wrench },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/estoque', label: 'Estoque', icon: Archive },
  { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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
