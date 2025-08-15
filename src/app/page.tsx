
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getUsers } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login: authLogin, isLoading: isAuthLoading } = useAuth();
  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // This useEffect ensures that the default users are loaded into localStorage on first visit.
  React.useEffect(() => {
    getUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const users = await getUsers(); // Fetch the most current user list directly.
      const userToAuth = users.find(u => u.login === login);

      if (userToAuth && userToAuth.password === password) {
        authLogin(userToAuth); // Pass the full user object to the auth context
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o dashboard...',
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Credenciais inválidas',
          description: 'Por favor, verifique seu usuário e senha.',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: 'Ocorreu um problema ao tentar fazer o login. Tente novamente.',
      });
      setIsSubmitting(false);
    }
  };
  
  const isLoading = isAuthLoading || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <Logo onLoginPage={true} />
          <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
          <CardDescription>
            Bem-vindo de volta! Insira seus dados para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Usuário</Label>
              <Input
                id="login"
                type="text"
                placeholder="Seu usuário"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
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
        <CardFooter className="justify-center text-xs text-muted-foreground">
            Versão 1.0
        </CardFooter>
      </Card>
    </div>
  );
}
