
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CircleUser,
  LogOut,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { removeSessionToken } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function HeaderActions() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        await removeSessionToken();
        toast({ title: 'Logout bem-sucedido!', description: 'Você foi desconectado.' });
        router.push('/');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <CircleUser className="h-5 w-5" />
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Minha Conta</span>
                </div>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/configuracoes">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
