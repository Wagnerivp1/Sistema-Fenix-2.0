
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getUsers, saveLoggedInUser } from '@/lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Fetch users from the server
    const users = await getUsers();
    const authenticatedUser = users.find(
      (user) => user.username === username && user.password === password
    );

    if (authenticatedUser) {
      if (authenticatedUser.active) {
          saveLoggedInUser(authenticatedUser); // Save logged in user to localStorage
          toast({
              title: 'Login bem-sucedido!',
              description: 'Redirecionando para o dashboard...',
          });
          router.push('/dashboard');
      } else {
           toast({
              variant: 'destructive',
              title: 'Usuário Inativo',
              description: 'Este usuário está desativado. Entre em contato com o administrador.',
          });
          setIsLoading(false);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Credenciais inválidas',
        description: 'Por favor, verifique seu usuário e senha.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <Logo className="justify-center" />
          <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
          <CardDescription>
            Bem-vindo de volta! Insira seus dados para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu usuário"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline" tabIndex={-1}>
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
