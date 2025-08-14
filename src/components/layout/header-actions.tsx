
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  CircleUser,
  LogOut,
  Settings,
  Paintbrush,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

export function HeaderActions() {
    const { setTheme, theme } = useTheme();
    const { user, logout } = useAuth();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <CircleUser className="h-5 w-5" />
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.name || 'Minha Conta'}</span>
                </div>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuLabel>{user?.name || 'Minha Conta'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/configuracoes">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Paintbrush className="mr-2 h-4 w-4" />
                    <span>Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                         <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                            <DropdownMenuRadioItem value="default">Padrão</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="slate">Slate</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="stone">Stone</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="rose">Rose</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="green">Verde</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="orange">Laranja</DropdownMenuRadioItem>
                             <DropdownMenuSeparator />
                            <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
