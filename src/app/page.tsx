
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { getUsers, saveUsers, saveSessionToken, getSessionToken } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // This function ensures the default user list is in localStorage on first load.
    getUsers(); 
    
    // If a token already exists, redirect to the dashboard
    if (getSessionToken()) {
        router.replace('/dashboard');
    } else {
        setIsLoading(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const users = await getUsers();
      const user = users.find(u => u.login === login);
      
      // Passwords in users.json are plain text, they are encoded on save.
      // We need to encode the input password to check against potentially already-encoded ones.
      const inputPasswordEncoded = btoa(password);

      if (user && (user.password === password || user.password === inputPasswordEncoded)) {
        const sessionToken = `TOKEN-${Date.now()}-${Math.random()}`;
        saveSessionToken(sessionToken, user.login); // Save token and user login
        toast({
          title: 'Login bem-sucedido!',
          description: `Bem-vindo, ${user.name}! Redirecionando...`,
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Credenciais inválidas',
          description: 'Por favor, verifique seu usuário e senha.',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: 'Ocorreu um problema ao tentar fazer o login. Tente novamente.',
      });
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <p>Carregando...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <Logo onLoginPage={true} />
          <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
              <Label htmlFor="login-user">Usuário</Label>
              <Input
                  id="login-user"
                  type="text"
                  placeholder="Seu usuário de login"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={isLoading}
              />
              </div>
              <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                  id="login-password"
                  type="password"
                  placeholder="Sua senha"
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
