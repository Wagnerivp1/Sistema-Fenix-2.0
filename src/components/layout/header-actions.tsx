
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  CircleUser,
  Moon,
  Sun,
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
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';

export function HeaderActions() {
    const { setTheme, themes, theme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                <Paintbrush className="mr-2 h-4 w-4" />
                <span>Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Escuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {themes.filter(t => t !== 'light' && t !== 'dark' && t !== 'system').map((t) => (
                        <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="capitalize">
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: `hsl(var(--theme-${t}-primary))` }}></div>
                            <span>{t === 'default' ? 'Padrão' : t}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/">Sair</Link>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
