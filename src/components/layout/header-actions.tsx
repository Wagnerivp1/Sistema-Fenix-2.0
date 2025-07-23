
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  CircleUser,
  Moon,
  Sun,
  Paintbrush,
  Check,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function HeaderActions() {
    const { setTheme, theme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/configuracoes">Configurações</Link>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
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
                            <DropdownMenuRadioItem value="green">Green</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="orange">Orange</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/">Sair</Link>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
